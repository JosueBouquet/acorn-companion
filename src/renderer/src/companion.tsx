import "tailwindcss"
import { createRoot } from "react-dom/client"
import { CompanionAvatar } from "./components/companion/CompanionAvatar"

const root = createRoot(document.getElementById("companion-root")!)
root.render(<CompanionAvatar />)
