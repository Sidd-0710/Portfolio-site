'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { SparklesIcon } from '@/components/ui/icons'
import { AskPanel } from './AskPanel'

const DIALOG_ID = 'ask-dialog'

/**
 * Floating "Ask about my work" button, on every page, that opens the
 * assistant in a modal. The panel mounts only while open, so its fetch and
 * state reset each time.
 */
export function AskLauncher() {
  const [open, setOpen] = useState(false)

  return (
    <>
      <div className="ask-launcher" hidden={open}>
        <Button
          onClick={() => setOpen(true)}
          aria-haspopup="dialog"
          aria-expanded={open}
          aria-controls={DIALOG_ID}
          leadingIcon={<SparklesIcon size={17} />}
        >
          <span className="hidden sm:inline">Ask about my work</span>
          <span className="sm:hidden">Ask AI</span>
        </Button>
      </div>

      <Modal
        id={DIALOG_ID}
        open={open}
        onClose={() => setOpen(false)}
        title="Ask about my work"
        size="lg"
        closeLabel="Close assistant"
      >
        {open && <AskPanel onNavigate={() => setOpen(false)} />}
      </Modal>
    </>
  )
}
