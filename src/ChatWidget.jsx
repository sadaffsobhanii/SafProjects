import { useEffect, useRef, useState } from 'react'
import { replyTo, SUGGESTED_PROMPTS } from './assistant.js'

export default function ChatWidget({ events, home }) {
  const [open, setOpen] = useState(false)
  const [text, setText] = useState('')
  const [messages, setMessages] = useState([
    {
      role: 'bot',
      text: 'I can tell you when to leave, and how to fit the gym around dinner. Try a prompt below — this demo assistant reads your sample calendar (not a live model).',
    },
  ])
  const scroller = useRef(null)

  useEffect(() => {
    if (!open || !scroller.current) return
    scroller.current.scrollTop = scroller.current.scrollHeight
  }, [messages, open])

  function send(value) {
    const input = (value ?? text).trim()
    if (!input) return
    const answer = replyTo(input, { events, home })
    setMessages((list) => [
      ...list,
      { role: 'user', text: input },
      { role: 'bot', text: answer },
    ])
    setText('')
  }

  return (
    <div className="chat">
      {open ? (
        <section className="chat-panel" aria-label="LeaveBy assistant">
          <header>
            <div>
              <strong>LeaveBy assistant</strong>
              <p>Ask when to leave, or how to plan gym + dinner</p>
            </div>
            <button type="button" className="chat-x" onClick={() => setOpen(false)} aria-label="Close chat">
              ×
            </button>
          </header>
          <div className="chat-log" ref={scroller}>
            {messages.map((item, index) => (
              <p key={index} className={item.role}>
                {item.text}
              </p>
            ))}
          </div>
          <div className="chat-chips">
            {SUGGESTED_PROMPTS.map((prompt) => (
              <button key={prompt} type="button" onClick={() => send(prompt)}>
                {prompt}
              </button>
            ))}
          </div>
          <form
            onSubmit={(event) => {
              event.preventDefault()
              send()
            }}
          >
            <input
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="What time should I leave my house?"
              aria-label="Message the assistant"
            />
            <button type="submit" className="btn google compact">
              Send
            </button>
          </form>
        </section>
      ) : null}

      <button
        type="button"
        className="chat-fab"
        onClick={() => setOpen((value) => !value)}
        aria-label={open ? 'Close assistant' : 'Open assistant'}
      >
        {open ? '×' : 'Chat'}
      </button>
    </div>
  )
}
