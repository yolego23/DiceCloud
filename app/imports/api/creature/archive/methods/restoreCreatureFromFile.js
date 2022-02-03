import SCHEMA_VERSION from '/imports/constants/SCHEMA_VERSION.js';
import SimpleSchema from 'simpl-schema';
import { ValidatedMethod } from 'meteor/mdg:validated-method';
import { RateLimiterMixin } from 'ddp-rate-limiter-mixin';
import Creatures from '/imports/api/creature/creatures/Creatures.js';
import CreatureProperties from '/imports/api/creature/creatureProperties/CreatureProperties.js';
import CreatureLogs from '/imports/api/creature/log/CreatureLogs.js';
import Experiences from '/imports/api/creature/experience/Experiences.js';
import { removeCreatureWork } from '/imports/api/creature/creatures/methods/removeCreature.js';
import ArchiveCreatureFiles from '/imports/api/creature/archive/ArchiveCreatureFiles.js';
let migrateArchive;
if (Meteor.isServer){
  migrateArchive = require('/imports/migrations/server/migrateArchive.js').default;
}

function restoreCreature(archive){
  if (SCHEMA_VERSION < archive.meta.schemaVersion){
    throw new Meteor.Error('Incompatible',
      'The archive file is from a newer version. Update required to read.')
  }

  // Migrate and verify the archive meets the current schema
  migrateArchive(archive);

  // Insert the creature sub documents
  // They still have their original _id's
  Creatures.insert(archive.creature);
  try {
    // Add all the properties
    if (archive.properties && archive.properties.length){
      CreatureProperties.batchInsert(archive.properties);
    }
    if (archive.experiences && archive.experiences.length){
      Experiences.batchInsert(archive.experiences);
    }
    if (archive.logs && archive.logs.length){
      CreatureLogs.batchInsert(archive.logs);
    }
  } catch (e) {
    // If the above fails, delete the inserted creature
    removeCreatureWork(archive.creature._id);
    throw e;
  }
}

const restoreCreaturefromFile = new ValidatedMethod({
  name: 'Creatures.methods.restoreCreaturefromFile',
  validate: new SimpleSchema({
    'fileId': {
      type: String,
      regEx: SimpleSchema.RegEx.Id,
    },
  }).validator(),
  mixins: [RateLimiterMixin],
  rateLimit: {
    numRequests: 10,
    timeInterval: 5000,
  },
  async run({fileId}) {
    // fetch the file
    const file = ArchiveCreatureFiles.findOne({_id: fileId}).get();
    if (!file){
      throw new Meteor.Error('File not found',
      'The requested creature archive does not exist');
    }
    // Assert ownership
    const userId = file?.userId;
    if (!userId || userId !== this.userId){
      throw new Meteor.Error('Permission denied',
      'You can only restore creatures you own');
    }
    if (Meteor.isServer){
      // Read the file data
      const archive = await ArchiveCreatureFiles.readJSONFile(file);
      restoreCreature(archive);
    }
    //Remove the archive once the restore succeeded
    ArchiveCreatureFiles.remove({_id: fileId});
  },
});

export default restoreCreaturefromFile;
