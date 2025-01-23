<template lang="html">
  <div
    class="d-flex flex-column-reverse"
    style="overflow: auto;"
  >
    <tabletop-log-stream-entry
      v-for="log in logs"
      :key="log._id"
      :model="log"
    />
  </div>
</template>

<script lang="js">
import CreatureLogs from '/imports/api/creature/log/CreatureLogs';
import TabletopLogStreamEntry from '/imports/client/ui/tabletop/TabletopLogStreamEntry.vue';

export default {
  components: {
    TabletopLogStreamEntry,
  },
  props: {
    tabletopId: {
      type: String,
      default: undefined,
    },
  },
  meteor: {
    logs() {
      const filter = {};
      if (this.tabletopId) {
        filter.tabletopId = this.tabletopId;
      } else if (this.creatureId) {
        filter.creatureId = this.creatureId;
      }
      return CreatureLogs.find(filter, {
        sort: {date: -1},
        limit: 100
      });
    },
  },
}
</script>
