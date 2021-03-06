import * as React from 'react';
import { useBosRebalanceMutation } from 'src/graphql/mutations/__generated__/bosRebalance.generated';
import { toast } from 'react-toastify';
import { getErrorContent } from 'src/utils/error';
import { Card, Separation, SingleLine } from 'src/components/generic/Styled';
import { InputWithDeco } from 'src/components/input/InputWithDeco';
import {
  MultiButton,
  SingleButton,
} from 'src/components/buttons/multiButton/MultiButton';
import { ColorButton } from 'src/components/buttons/colorButton/ColorButton';
import Modal from 'src/components/modal/ReactModal';
import { Plus, Minus } from 'react-feather';
import { chartColors } from 'src/styles/Themes';
import { ViewSwitch } from 'src/components/viewSwitch/ViewSwitch';
import { useMutationResultWithReset } from 'src/hooks/UseMutationWithReset';
import {
  useRebalanceState,
  useRebalanceDispatch,
} from 'src/context/RebalanceContext';
import { AdvancedResult } from './AdvancedResult';
import { ModalNodes } from './Modals/ModalNodes';
import { ModalChannels } from './Modals/ModalChannels';
import {
  RebalanceTag,
  RebalanceLine,
  RebalanceWrapLine,
  RebalanceSubTitle,
} from './Balance.styled';

export type RebalanceIdType = {
  alias: string;
  id: string;
};

const defaultRebalanceId: RebalanceIdType = {
  alias: '',
  id: '',
};

type StateType = {
  avoid: RebalanceIdType[];
  in_through: RebalanceIdType;
  is_avoiding_high_inbound: boolean;
  max_fee: number;
  max_fee_rate: number;
  max_rebalance: number;
  out_through: RebalanceIdType;
  target: number;
  node: RebalanceIdType;
};

export type ActionType =
  | {
      type: 'avoidHigh';
      avoid: boolean;
    }
  | {
      type: 'maxFee' | 'maxFeeRate' | 'maxRebalance' | 'target';
      amount: number;
    }
  | {
      type: 'withNode';
      node: RebalanceIdType;
    }
  | {
      type: 'outChannel' | 'inChannel';
      channel: RebalanceIdType;
    }
  | {
      type: 'avoidNodes';
      avoid: RebalanceIdType[];
    }
  | {
      type: 'addNode';
      node: RebalanceIdType;
    }
  | {
      type: 'removeNode';
      public_key: string;
    }
  | {
      type: 'clearFilters';
    };

const initialState: StateType = {
  avoid: [],
  in_through: defaultRebalanceId,
  is_avoiding_high_inbound: false,
  max_fee: 0,
  max_fee_rate: 0,
  max_rebalance: 0,
  out_through: defaultRebalanceId,
  target: 0,
  node: defaultRebalanceId,
};

const reducer = (state: StateType, action: ActionType): StateType => {
  switch (action.type) {
    case 'avoidHigh':
      return { ...state, is_avoiding_high_inbound: action.avoid };
    case 'maxFee':
      return { ...state, max_fee: action.amount };
    case 'maxFeeRate':
      return { ...state, max_fee_rate: action.amount };
    case 'maxRebalance':
      return { ...state, max_rebalance: action.amount };
    case 'target':
      return { ...state, target: action.amount };
    case 'withNode':
      return { ...state, node: action.node };
    case 'inChannel':
      return { ...state, in_through: action.channel };
    case 'outChannel':
      return { ...state, out_through: action.channel };
    case 'avoidNodes':
      return { ...state, avoid: action.avoid };
    case 'addNode': {
      const same = state.avoid.filter(n => n.id === action.node.id);
      if (same.length <= 0) {
        return { ...state, avoid: [...state.avoid, action.node] };
      }
      return state;
    }
    case 'removeNode': {
      const filtered = state.avoid.filter(n => n.id !== action.public_key);
      return { ...state, avoid: filtered };
    }
    case 'clearFilters':
      return initialState;
    default:
      return state;
  }
};

const SettingLine: React.FC<{ title: string }> = ({ children, title }) => (
  <RebalanceLine>
    <RebalanceSubTitle>{title}</RebalanceSubTitle>
    <SingleLine>{children}</SingleLine>
  </RebalanceLine>
);

export const AdvancedBalance = () => {
  const [openType, openTypeSet] = React.useState<string>('none');
  const [isDetailed, isDetailedSet] = React.useState<boolean>(false);

  const rebalanceDispatch = useRebalanceDispatch();
  const { inChannel, outChannel } = useRebalanceState();

  const in_through = inChannel
    ? {
        alias: inChannel.partner_node_info?.node?.alias,
        id: inChannel.partner_public_key,
      }
    : defaultRebalanceId;

  const out_through = outChannel
    ? {
        alias: outChannel.partner_node_info?.node?.alias,
        id: outChannel.partner_public_key,
      }
    : defaultRebalanceId;

  const [state, dispatch] = React.useReducer(reducer, {
    ...initialState,
    in_through,
    out_through,
  });

  const [rebalance, { data: _data, loading }] = useBosRebalanceMutation({
    onError: error => toast.error(getErrorContent(error)),
    onCompleted: () => {
      dispatch({ type: 'clearFilters' });
      toast.success('Balancing finished');
    },
    refetchQueries: ['GetChannels'],
  });
  const [data, resetMutationResult] = useMutationResultWithReset(_data);

  const renderButton = (
    onClick: () => void,
    text: string,
    selected: boolean
  ) => (
    <SingleButton selected={selected} onClick={onClick}>
      {text}
    </SingleButton>
  );

  const hasNode = !!state.node.alias;
  const hasInChannel = !!state.in_through.alias;
  const hasOutChannel = !!state.out_through.alias;
  const hasAvoid = state.avoid.length > 0;

  const renderDetails = () => (
    <>
      <Separation />
      <SettingLine title={'With Node'}>
        {hasNode ? <RebalanceTag>{state.node.alias}</RebalanceTag> : null}
        <ColorButton
          color={hasNode ? chartColors.red : undefined}
          onClick={() =>
            hasNode
              ? dispatch({ type: 'withNode', node: defaultRebalanceId })
              : openTypeSet('addNode')
          }
        >
          {hasNode ? <Minus size={18} /> : <Plus size={18} />}
        </ColorButton>
      </SettingLine>
      <SettingLine title={'Avoid Nodes'}>
        {hasAvoid && (
          <>
            <ViewSwitch hideMobile={true}>
              <RebalanceWrapLine>
                {state.avoid.map(a => (
                  <RebalanceTag key={a.id}>{a.alias}</RebalanceTag>
                ))}
              </RebalanceWrapLine>
            </ViewSwitch>
            <ViewSwitch>
              <RebalanceTag>{state.avoid.length}</RebalanceTag>
            </ViewSwitch>
          </>
        )}
        <ColorButton
          color={hasAvoid ? chartColors.red : undefined}
          onClick={() => openTypeSet('avoidNodes')}
        >
          {hasAvoid ? <Minus size={18} /> : <Plus size={18} />}
        </ColorButton>
      </SettingLine>
      <SettingLine title={'Increase Inbound Of'}>
        {hasOutChannel ? (
          <RebalanceTag>{state.out_through.alias}</RebalanceTag>
        ) : null}
        <ColorButton
          color={hasOutChannel ? chartColors.red : undefined}
          onClick={() => {
            if (hasOutChannel) {
              rebalanceDispatch({ type: 'setOut', channel: null });
              dispatch({
                type: 'outChannel',
                channel: defaultRebalanceId,
              });
            } else {
              openTypeSet('outChannel');
            }
          }}
        >
          {hasOutChannel ? <Minus size={18} /> : <Plus size={18} />}
        </ColorButton>
      </SettingLine>
      <SettingLine title={'Decrease Inbound Of'}>
        {hasInChannel ? (
          <RebalanceTag>{state.in_through.alias}</RebalanceTag>
        ) : null}
        <ColorButton
          color={hasInChannel ? chartColors.red : undefined}
          onClick={() => {
            if (hasInChannel) {
              rebalanceDispatch({ type: 'setIn', channel: null });
              dispatch({ type: 'inChannel', channel: defaultRebalanceId });
            } else {
              openTypeSet('inChannel');
            }
          }}
        >
          {hasInChannel ? <Minus size={18} /> : <Plus size={18} />}
        </ColorButton>
      </SettingLine>
      <RebalanceLine>
        <RebalanceSubTitle>Avoid High Inbound</RebalanceSubTitle>
        <MultiButton>
          {renderButton(
            () => dispatch({ type: 'avoidHigh', avoid: true }),
            'Yes',
            state.is_avoiding_high_inbound
          )}
          {renderButton(
            () => dispatch({ type: 'avoidHigh', avoid: false }),
            'No',
            !state.is_avoiding_high_inbound
          )}
        </MultiButton>
      </RebalanceLine>
      <InputWithDeco
        inputType={'number'}
        title={'Max Fee'}
        value={state.max_fee || ''}
        placeholder={'sats'}
        amount={state.max_fee}
        override={'sat'}
        inputCallback={value =>
          dispatch({ type: 'maxFee', amount: Number(value) })
        }
      />
      <InputWithDeco
        inputType={'number'}
        title={'Max Fee Rate'}
        value={state.max_fee_rate || ''}
        placeholder={'ppm'}
        amount={state.max_fee_rate}
        override={'ppm'}
        inputCallback={value =>
          dispatch({ type: 'maxFeeRate', amount: Number(value) })
        }
      />
      <InputWithDeco
        inputType={'number'}
        title={'Max Rebalance'}
        value={state.max_rebalance || ''}
        placeholder={'sats'}
        amount={state.max_rebalance}
        inputCallback={value =>
          dispatch({ type: 'maxRebalance', amount: Number(value) })
        }
      />
      <InputWithDeco
        inputType={'number'}
        title={'Target Amount'}
        value={state.target || ''}
        placeholder={'sats to rebalance'}
        amount={state.target}
        inputCallback={value =>
          dispatch({ type: 'target', amount: Number(value) })
        }
      />
      <Separation />
    </>
  );

  const renderModal = () => {
    switch (openType) {
      case 'addNode':
        return (
          <ModalNodes
            callback={node => {
              openTypeSet('none');
              dispatch({ type: 'withNode', node });
            }}
          />
        );
      case 'inChannel':
        return (
          <ModalChannels
            ignore={state.out_through.id}
            callback={channel => {
              openTypeSet('none');
              dispatch({ type: 'inChannel', channel });
            }}
          />
        );
      case 'outChannel':
        return (
          <ModalChannels
            ignore={state.in_through.id}
            callback={channel => {
              openTypeSet('none');
              dispatch({ type: 'outChannel', channel });
            }}
          />
        );
      case 'avoidNodes':
        return (
          <ModalNodes
            multi={true}
            dispatch={dispatch}
            nodes={state.avoid}
            openSet={() => openTypeSet('none')}
          />
        );
      default:
        return null;
    }
  };

  return (
    <>
      {data && data.bosRebalance ? (
        <Card mobileCardPadding={'0'} mobileNoBackground={true}>
          <AdvancedResult rebalanceResult={data.bosRebalance} />
          <ColorButton
            fullWidth={true}
            onClick={() => {
              resetMutationResult();
            }}
          >
            Balance Again
          </ColorButton>
        </Card>
      ) : (
        <Card mobileCardPadding={'0'} mobileNoBackground={true}>
          <InputWithDeco title={'Type'} noInput={true}>
            <MultiButton>
              {renderButton(
                () => {
                  dispatch({ type: 'clearFilters' });
                  isDetailedSet(false);
                },
                'Auto',
                !isDetailed
              )}
              {renderButton(() => isDetailedSet(true), 'Detailed', isDetailed)}
            </MultiButton>
          </InputWithDeco>
          {isDetailed && renderDetails()}
          <SingleLine>
            {isDetailed && (
              <ColorButton
                color={chartColors.orange2}
                withMargin={'16px 8px 0 0'}
                fullWidth={true}
                onClick={() => {
                  dispatch({ type: 'clearFilters' });
                }}
              >
                Reset
              </ColorButton>
            )}
            <ColorButton
              withMargin={'16px 0 0'}
              loading={loading}
              disabled={loading}
              fullWidth={true}
              onClick={() => {
                rebalance({
                  variables: {
                    ...state,
                    avoid: state.avoid.map(a => a.id),
                    node: state.node.id,
                    in_through: state.in_through.id,
                    out_through: state.out_through.id,
                  },
                });
              }}
            >
              Rebalance
            </ColorButton>
          </SingleLine>
        </Card>
      )}
      <Modal
        isOpen={openType !== 'none'}
        closeCallback={() => {
          openTypeSet('none');
        }}
      >
        {renderModal()}
      </Modal>
    </>
  );
};
