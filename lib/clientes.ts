export type ClienteOrdenable = {
  nombre: string
  apellido: string
}

export const sortClientes = <T extends ClienteOrdenable>(clientes: T[]) => {
  const collator = new Intl.Collator("es", { sensitivity: "base" })

  return [...clientes].sort((a, b) => {
    const labelA = `${a.nombre} ${a.apellido}`.trim()
    const labelB = `${b.nombre} ${b.apellido}`.trim()
    return collator.compare(labelA, labelB)
  })
}
