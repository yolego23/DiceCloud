import { debounce } from 'lodash';
import Creatures from '/imports/api/creature/creatures/Creatures';
import CreatureVariables from '/imports/api/creature/creatures/CreatureVariables';
import CreatureProperties, { CreatureProperty, CreaturePropertyByType } from '/imports/api/creature/creatureProperties/CreatureProperties';
import computeCreature from './computeCreature';
import { getFilter } from '/imports/api/parenting/parentingFunctions';
import { ComputedPropertyTypeMap } from '../properties/Property.type';

const COMPUTE_DEBOUNCE_TIME = 100; // ms
export const loadedCreatures: Map<string, LoadedCreature> = new Map(); // creatureId => {creature, properties, etc.}

// function logLoadedCreatures() {
//   let creatureLoadString = '';
//   for (const [key, value] of loadedCreatures.entries()) {
//     creatureLoadString += `${key}: ${value.subs.size}\n`;
//   }
//   console.log(creatureLoadString);
// }

export function loadCreature(creatureId: string, subscription: Tracker.Computation) {
  if (!creatureId) throw 'creatureId is required';
  let creature = loadedCreatures.get(creatureId);
  if (!creature?.subs.has(subscription)) {
    subscription.onStop(() => {
      unloadCreature(creatureId, subscription);
    });
  }
  if (creature) {
    creature.subs.add(subscription);
  } else {
    creature = new LoadedCreature(subscription, creatureId);
    loadedCreatures.set(creatureId, creature);
  }
  // logLoadedCreatures()
}

function unloadCreature(creatureId, subscription) {
  if (!creatureId) throw 'creatureId is required';
  const creature = loadedCreatures.get(creatureId);
  if (!creature) return;
  creature.subs.delete(subscription);
  if (creature.subs.size === 0) {
    creature.stop();
    loadedCreatures.delete(creatureId);
  }
  // logLoadedCreatures()
}

export function getSingleProperty(creatureId: string, propertyId: string) {
  const creature = loadedCreatures.get(creatureId)
  const property = creature?.properties.get(propertyId);
  if (property?.removed) return;
  if (property) {
    return EJSON.clone(property);
  }
  // console.time(`Cache miss on creature properties: ${creatureId}`)
  const prop = CreatureProperties.findOne({
    _id: propertyId,
    'root.id': creatureId,
    'removed': { $ne: true },
  });
  // console.timeEnd(`Cache miss on creature properties: ${creatureId}`);
  return prop;
}

export function getProperties(creatureId: string): CreatureProperty[] {
  const creature = loadedCreatures.get(creatureId);
  if (creature) {
    const props = Array.from(creature.properties.values())
      .sort((a, b) => a.left - b.left)
      .filter(prop => !prop.removed);
    return EJSON.clone(props);
  }
  // console.time(`Cache miss on creature properties: ${creatureId}`)
  const props = CreatureProperties.find({
    'root.id': creatureId,
    'removed': { $ne: true },
  }, {
    sort: { left: 1 },
  }).fetch();
  // console.timeEnd(`Cache miss on creature properties: ${creatureId}`);
  return props;
}

export function getPropertiesOfType<T extends keyof ComputedPropertyTypeMap>(creatureId, propType: T): CreaturePropertyByType<T>[] {
  const creature = loadedCreatures.get(creatureId);
  if (creature) {
    const props = Array.from(creature.properties.values())
      .filter(prop => !prop.removed && prop.type === propType)
      .sort((a, b) => a.left - b.left);
    return EJSON.clone(props) as unknown as CreaturePropertyByType<T>[];
  }
  // console.time(`Cache miss on creature properties: ${creatureId}`)
  const props = CreatureProperties.find({
    'root.id': creatureId,
    'removed': { $ne: true },
    'type': propType,
  }, {
    sort: { left: 1 },
  }).fetch();
  // console.timeEnd(`Cache miss on creature properties: ${creatureId}`);
  return props as unknown as CreaturePropertyByType<T>[];
}

/**
 * Get the properties of a creature that matches the filters given
 * @param creatureId The id of the creature
 * @param filterFn A function that returns true if the given prop matches the filter
 * @param mongoFilter A mongo selector that is exactly equal to the above function
 */
export function getPropertiesByFilter(creatureId, filterFn: (any) => boolean, mongoFilter: Mongo.Selector<object>) {
  const creature = loadedCreatures.get(creatureId);
  if (creature) {
    const props: CreatureProperty[] = Array.from(creature.properties.values())
      .filter(filterFn)
      .sort((a, b) => a.left - b.left);
    return EJSON.clone(props);
  }
  // console.time(`Cache miss on creature properties: ${creatureId}`)
  const props = CreatureProperties.find({
    'root.id': creatureId,
    'removed': { $ne: true },
    ...mongoFilter
  }, {
    sort: { left: 1 },
  }).fetch();
  // console.timeEnd(`Cache miss on creature properties: ${creatureId}`);
  return props;
}

export function getCreature(creatureId: string) {
  const loadedCreature = loadedCreatures.get(creatureId);
  const loadedCreatureDoc = loadedCreature?.creature;
  if (loadedCreatureDoc) {
    return EJSON.clone(loadedCreatureDoc);
  }
  // console.time(`Cache miss on Creature: ${creatureId}`);
  const creature = Creatures.findOne(creatureId);
  // console.timeEnd(`Cache miss on Creature: ${creatureId}`);
  return creature;
}

export function getVariables(creatureId: string) {
  const loadedCreature = loadedCreatures.get(creatureId);
  const loadedVariables = loadedCreature?.variables;
  if (loadedVariables) {
    return EJSON.clone(loadedVariables);
  }
  // console.time(`Cache miss on variables: ${creatureId}`);
  const variables = CreatureVariables.findOne({ _creatureId: creatureId });
  // console.timeEnd(`Cache miss on variables: ${creatureId}`);
  return variables;
}

export function replaceLinkedVariablesWithProps(variables) {
  for (const key in variables) {
    const propId = variables[key]?._propId;
    if (!propId) continue;
    variables[key] = getSingleProperty(variables._creatureId, propId);
  }
}

export function getPropertyAncestors(creatureId: string, propertyId: string) {
  const prop = getSingleProperty(creatureId, propertyId);
  if (!prop) return [];
  const loadedCreature = loadedCreatures.get(creatureId);
  if (loadedCreature) {
    // Get the ancestor properties from the cache
    const props: CreatureProperty[] = [];
    let currentProp: CreatureProperty | undefined = prop;
    // Iterate through parent chain to get all linked ancestors
    while (currentProp?.parentId) {
      currentProp = getSingleProperty(creatureId, currentProp.parentId);
      if (currentProp) props.push(currentProp);
    }
    return EJSON.clone(props);
  } else {
    // Fetch from database
    return CreatureProperties.find({
      ...getFilter.ancestors(prop),
      removed: { $ne: true },
    }, {
      sort: { left: 1 }
    }).fetch();
  }
}

export function getPropertyDescendants(creatureId, propertyId) {
  const property = getSingleProperty(creatureId, propertyId);
  if (!property) return [];
  if (loadedCreatures.has(creatureId)) {
    const creature = loadedCreatures.get(creatureId);
    if (!creature) return [];
    const props: CreatureProperty[] = [];
    // Loop through all properties and find ones that match the nested set condition
    for (const prop of creature.properties.values()) {
      if (
        prop.left > property.left
        && prop.right < property.right
        && prop.removed !== true
      ) {
        props.push(prop);
      }
    }
    const cloneProps = EJSON.clone(props).sort((a, b) => a.left - b.left);
    return cloneProps;
  } else {
    return CreatureProperties.find({
      ...getFilter.descendants(property),
      removed: { $ne: true },
    }, {
      sort: { left: 1 },
    }).fetch();
  }
}

/**
 * @param {string} creatureId Creature ID
 * @param {string | any} property prop or prop ID to get children of
 * @returns {any[]} An array of child properties in tree order
 */
export function getPropertyChildren(creatureId, property) {
  if (typeof property === 'string') {
    property = getSingleProperty(creatureId, property);
  }
  if (!property) return [];
  // This propertyId will always appear in the parent of the children
  if (loadedCreatures.has(creatureId)) {
    const creature = loadedCreatures.get(creatureId);
    if (!creature) return [];
    const props: CreatureProperty[] = [];
    for (const prop of creature.properties.values()) {
      if (prop.parentId === property._id && prop.removed !== true) {
        props.push(prop);
      }
    }
    const cloneProps = EJSON.clone(props);
    return cloneProps.sort((a, b) => a.left - b.left);
  } else {
    return CreatureProperties.find({
      'parentId': property._id,
      removed: { $ne: true },
    }, {
      sort: { left: 1 },
    }).fetch();
  }
}

class LoadedCreature {
  subs: Set<Tracker.Computation>;
  propertyObserver: Meteor.LiveQueryHandle;
  creatureObserver: Meteor.LiveQueryHandle;
  variablesObserver: Meteor.LiveQueryHandle;
  properties: Map<string, CreatureProperty>;
  creature: any;
  variables: any;

  constructor(sub, creatureId) {
    const self = this;
    // This may be called from a subscription, but we don't want the observers
    // to be destroyed with it, so use a non-reactive context to observe
    // the required documents
    Tracker.nonreactive(() => {
      self.subs = new Set([sub]);
      const compute = debounce(Meteor.bindEnvironment(() => {
        computeCreature(creatureId);
      }), COMPUTE_DEBOUNCE_TIME);

      self.properties = new Map();
      // Observe all creature properties which are needed for computation
      self.propertyObserver = CreatureProperties.find({
        'root.id': creatureId,
      }).observeChanges({
        added(id, fields) {
          fields._id = id;
          self.addProperty(fields);
          if (fields.dirty) compute();
        },
        changed(id, fields) {
          self.changeProperty(id, fields);
          if (fields.dirty) compute();
        },
        removed(id) {
          self.removeProperty(id);
          compute();
        },
      });

      // Observe the creature itself
      self.creatureObserver = Creatures.find({
        _id: creatureId,
      }).observeChanges({
        added(id, fields) {
          fields._id = id;
          self.addCreature(fields)
          if (fields.dirty) compute();
        },
        changed(id, fields) {
          self.changeCreature(id, fields);
          if (fields.dirty) compute();
        },
        removed() {
          self.removeCreature();
        },
      });

      // Observe the creature's variables
      self.variablesObserver = CreatureVariables.find({
        _creatureId: creatureId,
      }, {
        fields: { _creatureId: 0 },
      }).observeChanges({
        added(id, fields) {
          fields._id = id;
          self.addVariables(fields)
        },
        changed(id, fields) {
          self.changeVariables(id, fields);
        },
        removed() {
          self.removeVariables();
        },
      });
    });
  }
  stop() {
    this.propertyObserver.stop();
    this.creatureObserver.stop();
    this.variablesObserver.stop();
  }
  addProperty(prop) {
    this.properties.set(prop._id, prop);
  }
  changeProperty(id, fields) {
    LoadedCreature.changeMap(id, fields, this.properties);
  }
  removeProperty(id) {
    this.properties.delete(id)
  }
  addCreature(creature) {
    this.creature = creature;
  }
  changeCreature(id, fields) {
    LoadedCreature.changeDoc(this.creature, fields);
  }
  removeCreature() {
    delete this.creature;
  }
  addVariables(variables) {
    this.variables = variables;
  }
  changeVariables(id, fields) {
    LoadedCreature.changeDoc(this.variables, fields);
  }
  removeVariables() {
    delete this.variables;
  }
  static changeMap(id, fields, map) {
    const doc = map.get(id);
    LoadedCreature.changeDoc(doc, fields);
  }
  static changeDoc(doc, fields) {
    if (!doc) return;
    for (const key in fields) {
      if (key === undefined) {
        delete doc[key];
      } else {
        doc[key] = fields[key];
      }
    }
  }
}
