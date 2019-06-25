// eslint-disable
// this is an auto generated file. This will be overwritten

export const getNote = `query GetNote($id: ID!) {
  getNote(id: $id) {
    id
    note
    c00
    c01
    c02
    c03
    c04
    c05
    c06
    c07
    c08
    c09
  }
}
`;
export const listNotes = `query ListNotes(
  $filter: ModelNoteFilterInput
  $limit: Int
  $nextToken: String
) {
  listNotes(filter: $filter, limit: $limit, nextToken: $nextToken) {
    items {
      id
      note
      c00
      c01
      c02
      c03
      c04
      c05
      c06
      c07
      c08
      c09
    }
    nextToken
  }
}
`;
