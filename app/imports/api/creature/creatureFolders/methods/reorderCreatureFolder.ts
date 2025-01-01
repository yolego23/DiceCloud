import CreatureFolders from '/imports/api/creature/creatureFolders/CreatureFolders';
import { ValidatedMethod } from 'meteor/mdg:validated-method';
import { RateLimiterMixin } from 'ddp-rate-limiter-mixin';
import { zId } from '/imports/api/utility/zId'
import { z } from 'zod';
import { CreatureFolder } from '/imports/api/creature/creatureFolders/CreatureFolders';
import zodSchemaMixin from '/imports/api/utility/zodSchemaMixin';

const schema = z.object({
  _id: zId(),
  order: CreatureFolder.shape.order,
});

const reorderCreatureFolder = new ValidatedMethod({
  name: 'creatureFolders.methods.reorder',
  schema,
  validate: null,
  mixins: [RateLimiterMixin, zodSchemaMixin],
  rateLimit: {
    numRequests: 5,
    timeInterval: 5000,
  },
  run({ _id, order }: z.infer<typeof schema>) {
    // Ensure logged in
    const userId = this.userId;
    if (!userId) {
      throw new Meteor.Error('creatureFolders.methods.reorder.denied',
        'You need to be logged in to reorder a folder');
    }
    // Check that this folder is owned by the user
    const existingFolder = CreatureFolders.findOne(_id);
    if (!existingFolder) {
      throw new Meteor.Error('creatureFolders.methods.updateName.denied',
        'The specified folder does not exist');
    }
    if (existingFolder.owner !== userId) {
      throw new Meteor.Error('creatureFolders.methods.reorder.denied',
        'This folder does not belong to you');
    }
    // First give it the new order, it should end in 0.5 putting it between two other docs
    CreatureFolders.update(_id, { $set: { order } });
    this.unblock();
    // Reorder all the folders with integer numbers in this new order
    CreatureFolders.find({
      owner: userId
    }, {
      fields: { order: 1, },
      sort: { order: 1 }
    }).forEach((folder, index) => {
      if (folder.order !== index) {
        CreatureFolders.update(_id, { $set: { order: index } })
      }
    });
  },
});

export default reorderCreatureFolder;
