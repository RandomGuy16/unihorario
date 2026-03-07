
// Function to capitalize strings
export function capitalize(str: string): string {
  if (!str) return str
  let out = ""
  const subStrings = str.split(' ')
  for (let i = 0; i < subStrings.length; i++) {
    if (subStrings[i].length > 0) {
      out += subStrings[i].charAt(0).toLocaleUpperCase() + subStrings[i].slice(1).toLocaleLowerCase()
      if (i < subStrings.length - 1) {
        out += ' '
      }
    }
  }
  return out
}

// function to compare two arrays of strings
export function areEqualArray<T>(left: T[], right: T[]): boolean {
  if (left.length !== right.length) return false
  return left.every((value, index) => value === right[index])
}