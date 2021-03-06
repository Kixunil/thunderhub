import { logger } from 'server/helpers/logger';
import { toWithError } from 'server/helpers/async';
import { getChannel } from 'ln-service';
import { GetChannelType } from 'server/types/ln-service.types';
import { openChannel } from './resolvers/mutation/openChannel';
import { closeChannel } from './resolvers/mutation/closeChannel';
import { updateFees } from './resolvers/mutation/updateFees';
import { updateMultipleFees } from './resolvers/mutation/updateMultipleFees';
import { getChannelBalance } from './resolvers/query/getChannelBalance';
import { getChannels } from './resolvers/query/getChannels';
import { getClosedChannels } from './resolvers/query/getClosedChannels';
import { getPendingChannels } from './resolvers/query/getPendingChannels';

type ParentType = {
  lnd: {};
  id: String;
  localKey: String;
};

export const channelResolvers = {
  Query: {
    getChannelBalance,
    getChannels,
    getClosedChannels,
    getPendingChannels,
  },
  Mutation: {
    openChannel,
    closeChannel,
    updateFees,
    updateMultipleFees,
  },
  Channel: {
    channel: async (parent: ParentType) => {
      const { lnd, id, localKey } = parent;

      if (!lnd) {
        logger.debug('ExpectedLNDToGetChannel');
        return null;
      }

      if (!id) {
        logger.debug('ExpectedIdToGetChannel');
        return null;
      }

      const [channel, error] = await toWithError(getChannel({ lnd, id }));

      if (error) {
        logger.debug(`Error getting channel with id ${id}: %o`, error);
        return null;
      }

      let node_policies = null;
      let partner_node_policies = null;

      (channel as GetChannelType).policies.forEach(policy => {
        if (localKey && localKey === policy.public_key) {
          node_policies = {
            ...policy,
            node: { lnd, publicKey: policy.public_key },
          };
        } else {
          partner_node_policies = {
            ...policy,
            node: { lnd, publicKey: policy.public_key },
          };
        }
      });

      return {
        ...(channel as GetChannelType),
        node_policies,
        partner_node_policies,
      };
    },
  },
};
