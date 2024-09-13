/**
 * @param ...a - variadic list of things
 * @returns a single-layer flattened array of the things
 */
export const yar = ((...a) => [...a.flat()])()
