import { useState, useEffect, useRef, type MouseEvent } from "react"
import type { AvatarStatus } from "@shared/types"

const STATUS_IMAGES: Record<AvatarStatus, string> = {
  idle: "./avatars/idle.png",
  active: "./avatars/active.png",
  thinking: "./avatars/thinking.png",
  speaking: "./avatars/speaking.png",
  sassy: "./avatars/sassy.png",
  happy: "./avatars/happy.png",
  ok: "./avatars/ok.png"
}

export function CompanionAvatar() {
  const [status, setStatus] = useState<AvatarStatus>("idle")
  const statusRef = useRef<AvatarStatus>("idle")
  const dragRef = useRef({ x: 0, y: 0 })

  useEffect(() => {
    return window.api.onAvatarStatus((s) => {
      statusRef.current = s
      setStatus(s)
    })
  }, [])

  useEffect(() => {
    const transient: AvatarStatus[] = ["active", "happy", "ok"]
    if (!transient.includes(status)) return

    const delay = status === "active" ? 5000 : 1500
    const timer = setTimeout(() => {
      if (statusRef.current === status) {
        setStatus("idle")
        statusRef.current = "idle"
      }
    }, delay)

    return () => clearTimeout(timer)
  }, [status])

  const handleClick = () => {
    statusRef.current = "active"
    setStatus("active")
    window.api.openAssistant()
  }

  const handleMouseDown = (e: MouseEvent) => {
    if (e.button !== 0) return
    dragRef.current = { x: e.screenX, y: e.screenY }

    const onMove = (ev: globalThis.MouseEvent) => {
      const dx = ev.screenX - dragRef.current.x
      const dy = ev.screenY - dragRef.current.y
      if (Math.abs(dx) > 3 || Math.abs(dy) > 3) {
        window.api.moveWindow(dx, dy)
      }
      dragRef.current = { x: ev.screenX, y: ev.screenY }
    }

    const onUp = (ev: globalThis.MouseEvent) => {
      window.removeEventListener("mousemove", onMove)
      window.removeEventListener("mouseup", onUp)

      const dx = Math.abs(ev.screenX - dragRef.current.x)
      const dy = Math.abs(ev.screenY - dragRef.current.y)
      if (dx < 5 && dy < 5) {
        handleClick()
      }
    }

    window.addEventListener("mousemove", onMove)
    window.addEventListener("mouseup", onUp)
  }

  return (
    <div
      className="cursor-grab active:cursor-grabbing select-none"
      style={{
        width: "100%",
        height: "100%",
        backgroundImage: `url(${STATUS_IMAGES[status]})`,
        backgroundSize: "contain",
        backgroundRepeat: "no-repeat",
        backgroundPosition: "center"
      }}
      onMouseDown={handleMouseDown}
      onContextMenu={(e) => e.preventDefault()}
    />
  )
}
