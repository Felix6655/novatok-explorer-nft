import { styled } from '@stitches/react'
import * as DialogPrimitive from '@radix-ui/react-dialog'
import {
  ComponentPropsWithoutRef,
  ElementRef,
  forwardRef,
  ReactNode,
  useState,
} from 'react'
import { AnimatePresence, motion } from 'framer-motion'

const Overlay = styled(DialogPrimitive.Overlay, {
  backgroundColor: '$neutralBg',
  position: 'fixed',
  inset: 0,
  zIndex: 5000,
})

const AnimatedOverlay = forwardRef<
  ElementRef<typeof Overlay>,
  ComponentPropsWithoutRef<typeof Overlay>
>(({ ...props }, forwardedRef) => (
  <Overlay {...props} forceMount asChild>
    <motion.div
      ref={forwardedRef}
      transition={{ duration: 0.5 }}
      initial={{
        opacity: 0,
      }}
      animate={{ opacity: props['style']?.opacity }}
      exit={{ opacity: 0 }}
    />
  </Overlay>
))

AnimatedOverlay.displayName = 'AnimatedOverlay'

const Content = styled(DialogPrimitive.Content, {
  backgroundColor: '$neutralBg',
  borderRadius: 8,
  $$shadowColor: '$colors$gray7',
  boxShadow: 'box-shadow: 0px 2px 16px $$shadowColor',
  border: '1px solid $gray7',
  position: 'fixed',
  top: '12.5%',
  left: '50%',
  transform: 'translateX(-50%)',
  minWidth: 490,
  maxWidth: '90vw',
  maxHeight: '85vh',
  overflowY: 'auto',
  '&:focus': { outline: 'none' },
  zIndex: 5000,
})

const AnimatedContent = forwardRef<
  ElementRef<typeof DialogPrimitive.Content>,
  ComponentPropsWithoutRef<typeof DialogPrimitive.Content>
>(({ children, ...props }, forwardedRef) => {
  return (
    <DialogPrimitive.Content ref={forwardedRef} forceMount {...props}>
      <motion.div
        transition={{ type: 'spring', duration: 0.5 }}
        initial={{ opacity: 0, top: '40%' }}
        animate={{ opacity: 1, top: '50%' }}
        exit={{ opacity: 0, top: '40%' }}
      >
        {children}
      </motion.div>
    </DialogPrimitive.Content>
  )
})

AnimatedContent.displayName = 'AnimatedContent'

type Props = {
  trigger?: ReactNode
  portalProps?: ComponentPropsWithoutRef<typeof DialogPrimitive.Portal>
  overlayProps?: ComponentPropsWithoutRef<typeof DialogPrimitive.Overlay>
  open?: ComponentPropsWithoutRef<typeof DialogPrimitive.Root>['open']
  onOpenChange?: ComponentPropsWithoutRef<
    typeof DialogPrimitive.Root
  >['onOpenChange']
}

const Dialog = forwardRef<
  ElementRef<typeof DialogPrimitive.Content>,
  ComponentPropsWithoutRef<typeof DialogPrimitive.Content> & Props
>(
  (
    {
      children,
      trigger,
      portalProps,
      overlayProps,
      open,
      onOpenChange,
      ...props
    },
    forwardedRef
  ) => {
    const [_open, _onOpenChange] = useState(false)

    return (
      <DialogPrimitive.Root
        onOpenChange={onOpenChange || _onOpenChange}
        open={open !== undefined ? open : _open}
      >
        {trigger && (
          <DialogPrimitive.Trigger asChild>
            {trigger}
          </DialogPrimitive.Trigger>
        )}
        <AnimatePresence>
          {(open !== undefined ? open : _open) && (
            <DialogPrimitive.Portal forceMount {...portalProps}>
              <AnimatedOverlay style={{ opacity: 1 }} {...overlayProps} />
              <AnimatedContent ref={forwardedRef} {...props}>
                {children}
              </AnimatedContent>
            </DialogPrimitive.Portal>
          )}
        </AnimatePresence>
      </DialogPrimitive.Root>
    )
  }
)

Dialog.displayName = 'Dialog'

export { Dialog, AnimatedContent, AnimatedOverlay, Content, Overlay }
