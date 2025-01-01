import CreatureFolders from '/imports/api/creature/creatureFolders/CreatureFolders';
import { ValidatedMethod } from 'meteor/mdg:validated-method';
import { RateLimiterMixin } from 'ddp-rate-limiter-mixin';
import { zId } from '/imports/api/utility/zId'
import { z } from 'zod';
import { CreatureFolder } from '/imports/api/creature/creatureFolders/CreatureFolders';

const schema = z.object({
  _id: zId(),
  name: CreatureFolder.shape.name,
});

const updateCreatureFolderName = new ValidatedMethod({
  name: 'creatureFolders.methods.updateName',
  schema,
  validate: null,
  mixins: [RateLimiterMixin],
  rateLimit: {
    numRequests: 5,
    timeInterval: 5000,
  },
  run({ _id, name }: z.infer<typeof schema>) {
    // Ensure logged in
    const userId = Meteor.userId();
    if (!userId) {
      throw new Meteor.Error('creatureFolders.methods.updateName.denied',
        'You need to be logged in to update a folder');
    }
    // Check that this folder is owned by the user
    const existingFolder = CreatureFolders.findOne(_id);
    if (!existingFolder) {
      throw new Meteor.Error('creatureFolders.methods.updateName.denied',
        'The specified folder doesn\'t exist');
    }
    if (existingFolder.owner !== userId) {
      throw new Meteor.Error('creatureFolders.methods.updateName.denied',
        'This folder does not belong to you');
    }
    // Update
    return CreatureFolders.update(_id, { $set: { name } });
  },
});

export default updateCreatureFolderName;
