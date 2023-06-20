import Button from '@/components/Button'
import Dropdown from '@/components/inputs/SelectInput'
import ProfilePreview from '@/components/ProfilePreview'
import useGetTheme from '@/hooks/useGetTheme'
import { SendMessageParams } from '@/services/subsocial/commentIds'
import { getAccountDataQuery } from '@/services/subsocial/evmAddresses'
import { useMyAccount } from '@/stores/my-account'
import { cx } from '@/utils/class-names'
import BigNumber from 'bignumber.js'
import { parseUnits } from 'ethers'
import { useState } from 'react'
import { useAccount, useNetwork } from 'wagmi'
import CommonExtensionModal from '../../CommonExtensionModal'
import { chainIdByChainName } from '../api/config'
import { useDonate, useGetBalance } from '../api/hooks'
import AmountInput from './AmountInput'
import { chainItems, tokensItems } from './DonateModal'
import { DonateProps } from './types'

function DonateForm({
  recipient,
  messageId,
  chatId,
  setCurrentStep,
  chainState,
  tokenState,
  onSwitchButtonClick,
  ...props
}: DonateProps) {
  const [selectedChain, setSelectedChain] = chainState
  const [selectedToken, setSelectedToken] = tokenState

  const theme = useGetTheme()
  const { isConnected } = useAccount()
  const isDarkTheme = theme === 'dark'
  const [inputError, setInputError] = useState<string | undefined>()
  const [amount, setAmount] = useState<string>('')
  const address = useMyAccount((state) => state.address)
  const { chain } = useNetwork()

  const { balance, decimals } = useGetBalance(
    selectedToken.id,
    selectedChain.id
  )

  const { data: recipientAccountData } = getAccountDataQuery.useQuery(recipient)
  const { data: myAccountData } = getAccountDataQuery.useQuery(address || '')

  const { evmAddress: evmRecipientAddress } = recipientAccountData || {}
  const { evmAddress: myEvmAddress } = myAccountData || {}

  const currentChainId = chain?.id
  const destChainId = chainIdByChainName[selectedChain.id]

  const showSwichButton = !isConnected || currentChainId !== destChainId

  const { sendTransferTx } = useDonate(selectedToken.id, selectedChain.id)

  const onButtonClick = async (messageParams: SendMessageParams) => {
    if (!evmRecipientAddress || !myEvmAddress || !amount) {
      return { txPrevented: true }
    }

    const amountValue = parseUnits(parseFloat(amount).toString(), decimals)

    const hash = await sendTransferTx(
      evmRecipientAddress,
      amountValue,
      setCurrentStep,
      selectedToken.isNativeToken,
      decimals
    )

    if (hash && address && decimals) {
      const newMessageParams: SendMessageParams = {
        ...messageParams,
        extensions: [
          {
            id: 'subsocial-donations',
            properties: {
              chain: selectedChain.id,
              from: myEvmAddress,
              to: evmRecipientAddress,
              token: selectedToken.label,
              decimals,
              amount: amountValue.toString(),
              txHash: hash,
            },
          },
        ],
      }

      props.closeModal()
      return { newMessageParams, txPrevented: false }
    }

    return { txPrevented: true }
  }

  const disableSendButton =
    !amount ||
    !balance ||
    new BigNumber(amount || '0').lte(0) ||
    new BigNumber(balance || '0').eq(0)

  const amountPreview = amount
    ? ` ${new BigNumber(amount).toString()} ${selectedToken.label}`
    : ''

  return (
    <CommonExtensionModal
      {...props}
      chatId={chatId}
      showChatForm={!showSwichButton}
      withDivider={!showSwichButton}
      disableSendButton={disableSendButton || !!inputError}
      sendButtonText={`Send${amountPreview}`}
      beforeMesageSend={onButtonClick}
      autofocus={false}
      title={'💰 Donate'}
      withCloseButton
      panelClassName='pb-5'
    >
      <div>
        <div className='mb-2 flex justify-between text-sm font-normal leading-4 text-gray-400'>
          Recipient
        </div>
        <div
          className={cx(
            'mb-6 mt-2 rounded-2xl p-4',
            isDarkTheme ? 'bg-slate-700' : 'bg-slate-200'
          )}
        >
          <ProfilePreview
            address={recipient}
            avatarClassName='h-12 w-12'
            withGrillAddress={false}
          />
        </div>
        <div className='flex flex-col gap-6'>
          <Dropdown
            selected={selectedChain}
            setSelected={setSelectedChain}
            fieldLabel='Chain'
            items={chainItems}
          />
          <Dropdown
            selected={selectedToken}
            setSelected={setSelectedToken}
            fieldLabel='Token'
            items={tokensItems}
          />
          {showSwichButton ? (
            <Button size={'lg'} onClick={onSwitchButtonClick}>
              {!isConnected ? 'Connect' : 'Switch'} to {selectedChain.label}
            </Button>
          ) : (
            <AmountInput
              amount={amount}
              setAmount={setAmount}
              inputError={inputError}
              setInputError={setInputError}
              tokenSymbol={selectedToken.label}
              balance={balance}
              decimals={decimals}
            />
          )}
        </div>
      </div>
    </CommonExtensionModal>
  )
}

export default DonateForm
