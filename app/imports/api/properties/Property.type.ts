import { Attribute, ComputedAttribute, ComputedOnlyAttribute } from './Attributes';
import { Branch, ComputedBranch, ComputedOnlyBranch } from './Branches';
import { Buff, ComputedBuff, ComputedOnlyBuff } from './Buffs';
import { Class, ComputedClass, ComputedOnlyClass } from './Classes';
import { Constant, ComputedConstant, ComputedOnlyConstant } from './Constants';
import { Container, ComputedContainer, ComputedOnlyContainer } from './Containers';
import { CreatureTemplate, ComputedCreatureTemplate, ComputedOnlyCreatureTemplate } from './CreatureTemplates';
import { Damage, ComputedDamage, ComputedOnlyDamage } from './Damages';
import { DamageMultiplier, ComputedDamageMultiplier, ComputedOnlyDamageMultiplier } from './DamageMultipliers';
import { Effect, ComputedEffect, ComputedOnlyEffect } from './Effects';
import { Feature, ComputedFeature, ComputedOnlyFeature } from './Features';
import { Folder, ComputedFolder, ComputedOnlyFolder } from './Folders';
import { Item, ComputedItem, ComputedOnlyItem } from './Items';
import { Note, ComputedNote, ComputedOnlyNote } from './Notes';
import { PointBuy, ComputedPointBuy, ComputedOnlyPointBuy } from './PointBuys';
import { Proficiency, ComputedProficiency, ComputedOnlyProficiency } from './Proficiencies';
import { Reference, ComputedReference, ComputedOnlyReference } from './References';
import { Roll, ComputedRoll, ComputedOnlyRoll } from './Rolls';
import { SavingThrow, ComputedSavingThrow, ComputedOnlySavingThrow } from './SavingThrows';
import { Skill, ComputedSkill, ComputedOnlySkill } from './Skills';
import { Slot, ComputedSlot, ComputedOnlySlot } from './Slots';
import { SpellList, ComputedSpellList, ComputedOnlySpellList } from './SpellLists';
import { Spell, ComputedSpell, ComputedOnlySpell } from './Spells';
import { Toggle, ComputedToggle, ComputedOnlyToggle } from './Toggles';
import { Trigger, ComputedTrigger, ComputedOnlyTrigger } from './Triggers';

export type PropertyTypeMap = {
  'attribute': Attribute,
  'branch': Branch,
  'buff': Buff,
  'class': Class,
  'constant': Constant,
  'container': Container,
  'creatureTemplate': CreatureTemplate,
  'damage': Damage,
  'damageMultiplier': DamageMultiplier,
  'effect': Effect,
  'feature': Feature,
  'folder': Folder,
  'item': Item,
  'note': Note,
  'pointBuy': PointBuy,
  'proficiency': Proficiency,
  'reference': Reference,
  'roll': Roll,
  'savingThrow': SavingThrow,
  'skill': Skill,
  'slot': Slot,
  'spellList': SpellList,
  'spell': Spell,
  'toggle': Toggle,
  'trigger': Trigger,
}

export type Property<T extends keyof PropertyTypeMap> = PropertyTypeMap[T]

export type ComputedPropertyTypeMap = {
  'attribute': ComputedAttribute,
  'branch': ComputedBranch,
  'buff': ComputedBuff,
  'class': ComputedClass,
  'constant': ComputedConstant,
  'container': ComputedContainer,
  'creatureTemplate': ComputedCreatureTemplate,
  'damage': ComputedDamage,
  'damageMultiplier': ComputedDamageMultiplier,
  'effect': ComputedEffect,
  'feature': ComputedFeature,
  'folder': ComputedFolder,
  'item': ComputedItem,
  'note': ComputedNote,
  'pointBuy': ComputedPointBuy,
  'proficiency': ComputedProficiency,
  'reference': ComputedReference,
  'roll': ComputedRoll,
  'savingThrow': ComputedSavingThrow,
  'skill': ComputedSkill,
  'slot': ComputedSlot,
  'spellList': ComputedSpellList,
  'spell': ComputedSpell,
  'toggle': ComputedToggle,
  'trigger': ComputedTrigger,
}

export type ComputedProperty<T extends keyof ComputedPropertyTypeMap> = ComputedPropertyTypeMap[T]

export type ComputedOnlyPropertyTypeMap = {
  'attribute': ComputedOnlyAttribute,
  'branch': ComputedOnlyBranch,
  'buff': ComputedOnlyBuff,
  'class': ComputedOnlyClass,
  'constant': ComputedOnlyConstant,
  'container': ComputedOnlyContainer,
  'creatureTemplate': ComputedOnlyCreatureTemplate,
  'damage': ComputedOnlyDamage,
  'damageMultiplier': ComputedOnlyDamageMultiplier,
  'effect': ComputedOnlyEffect,
  'feature': ComputedOnlyFeature,
  'folder': ComputedOnlyFolder,
  'item': ComputedOnlyItem,
  'note': ComputedOnlyNote,
  'pointBuy': ComputedOnlyPointBuy,
  'proficiency': ComputedOnlyProficiency,
  'reference': ComputedOnlyReference,
  'roll': ComputedOnlyRoll,
  'savingThrow': ComputedOnlySavingThrow,
  'skill': ComputedOnlySkill,
  'slot': ComputedOnlySlot,
  'spellList': ComputedOnlySpellList,
  'spell': ComputedOnlySpell,
  'toggle': ComputedOnlyToggle,
  'trigger': ComputedOnlyTrigger,
}

export type ComputedOnlyProperty<T extends keyof ComputedOnlyPropertyTypeMap> = ComputedOnlyPropertyTypeMap[T]
