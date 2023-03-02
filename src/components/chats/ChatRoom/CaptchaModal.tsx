import Button from '@/components/Button'
import Modal, { ModalFunctionalityProps } from '@/components/Modal'
import { useSignUpAndSendMessage } from '@/hooks/useSignUpAndSendMessage'
import { SendMessageParams } from '@/services/subsocial/commentIds'
import { generateAccount } from '@/utils/account'
import HCaptcha from '@hcaptcha/react-hcaptcha'
import { useRef, useState } from 'react'

export type CaptchaModalProps = ModalFunctionalityProps & SendMessageParams

const siteKey = '10000000-ffff-ffff-ffff-000000000001'

export default function CaptchaModal({
  message,
  rootPostId,
  spaceId,
  ...props
}: CaptchaModalProps) {
  const { mutateAsync: signUpAndSendMessage } = useSignUpAndSendMessage()
  const [token, setToken] = useState('')
  const [captchaError, setCaptchaError] = useState('')
  const captchaRef = useRef<HCaptcha>(null)

  const [loaded, setLoaded] = useState(false)
  const onLoad = () => {
    setLoaded(true)
  }

  const submitCaptcha = async () => {
    const { publicKey, secretKey } = await generateAccount()
    signUpAndSendMessage({
      secretKey,
      address: publicKey,
      captchaToken: token,
      message,
      rootPostId,
      spaceId,
    })
    captchaRef.current?.resetCaptcha()
    props.closeModal()
  }

  const onExpire = () => {
    setToken('')
    setCaptchaError('Captcha expired, please try again.')
  }

  const onError = () => {
    setToken('')
    setCaptchaError('Captcha error, please try again.')
  }

  return (
    <Modal
      {...props}
      size='sm'
      titleClassName='text-center'
      title='🤖 Are you a human?'
    >
      <div className='flex flex-col items-stretch gap-6 pt-4'>
        <div className='flex flex-col items-center'>
          {!loaded && <div className='w-full' style={{ height: '78px' }} />}
          <HCaptcha
            onLoad={onLoad}
            theme='dark'
            onVerify={setToken}
            onExpire={onExpire}
            sitekey={siteKey}
            onError={onError}
            ref={captchaRef}
          />
          {captchaError && (
            <p className='mt-2 text-sm text-red-400'>{captchaError}</p>
          )}
        </div>
        <Button disabled={!token} size='lg' onClick={submitCaptcha}>
          Continue
        </Button>
      </div>
    </Modal>
  )
}
