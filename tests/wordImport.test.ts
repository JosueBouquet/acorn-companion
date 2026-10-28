import { describe, expect, it } from "vitest"
import { parseWordHistory } from "../src/renderer/src/services/wordImport"

describe("parseWordHistory", () => {
  it("parses entries separated by blank lines", () => {
    const text = `inventory
inventario
I have 64 diamonds in my inventory.

awkward
incómodo
It was an awkward silence.`

    expect(parseWordHistory(text)).toEqual([
      {
        word: "inventory",
        meaning: "inventario",
        example: "I have 64 diamonds in my inventory."
      },
      {
        word: "awkward",
        meaning: "incómodo",
        example: "It was an awkward silence."
      }
    ])
  })

  it("parses copies that still contain the Palabra label", () => {
    const text = `Palabra
inventory
inventario
I have 64 diamonds in my inventory.
Palabra
awkward
incómodo
It was an awkward silence.`

    expect(parseWordHistory(text)).toEqual([
      {
        word: "inventory",
        meaning: "inventario",
        example: "I have 64 diamonds in my inventory."
      },
      {
        word: "awkward",
        meaning: "incómodo",
        example: "It was an awkward silence."
      }
    ])
  })

  it("parses labeled entries", () => {
    const text = `Palabra: inventory
Significado: inventario
Ejemplo: I have 64 diamonds in my inventory.

Palabra: awkward
Significado: incómodo
Ejemplo: It was an awkward silence.`

    expect(parseWordHistory(text)).toEqual([
      {
        word: "inventory",
        meaning: "inventario",
        example: "I have 64 diamonds in my inventory."
      },
      {
        word: "awkward",
        meaning: "incómodo",
        example: "It was an awkward silence."
      }
    ])
  })

  it("parses tab and pipe separated single lines", () => {
    expect(parseWordHistory("inventory\tinventario\tI have 64 diamonds.")).toEqual([
      {
        word: "inventory",
        meaning: "inventario",
        example: "I have 64 diamonds."
      }
    ])

    expect(parseWordHistory("awkward | incómodo | It was awkward.")).toEqual([
      {
        word: "awkward",
        meaning: "incómodo",
        example: "It was awkward."
      }
    ])
  })

  it("keeps a lone word so the user can complete the meaning later", () => {
    expect(parseWordHistory("inventory")).toEqual([
      { word: "inventory", meaning: "", example: "" }
    ])
  })

  it("returns no entries for blank text", () => {
    expect(parseWordHistory("   \n\n  ")).toEqual([])
  })
})
