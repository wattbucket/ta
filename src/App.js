import React, { useState, useEffect } from 'react';
import { withAuthenticator } from 'aws-amplify-react';
import { API, graphqlOperation } from 'aws-amplify';
import { createNote, deleteNote, updateNote } from './graphql/mutations';
import { listNotes } from './graphql/queries';
import { onCreateNote, onDeleteNote, onUpdateNote } from './graphql/subscriptions';
import _ from 'lodash';

function App() {

  const [state, setState] = useState({
    id: '',
    note: '',
    c01: '',
    notes: []
  })

  async function fetchNotes() {
    const res = await API.graphql(graphqlOperation(listNotes))
    await setState({ ...state, notes: res.data.listNotes.items })
  }

  useEffect( () => {
    fetchNotes(); // THIS WILL LOAD INITIAL NOTES

    // THIS WILL SUBSCRIBE TO ONCREATE
    const createNoteListener = API.graphql(graphqlOperation(onCreateNote)).subscribe({
      next: noteData => { // THIS WILL FIRE ON EACH CREATE NOTE
        const newNote = noteData.value.data.onCreateNote; // NOTE RETURNED
        setState( prevState => { // IMP : THIS IS HOW TO ACCESS PREV STATE FOR AN UPDATE
          const prevNotes = [...prevState.notes].filter( note => note.id !== newNote.id );
          const updatedNotes = [...prevNotes, newNote]; 
          return { ...prevState, notes: updatedNotes }
        })
      }
    })

    // THIS WILL SUBSCRIBE TO ONDELETE
    const deleteNoteListener = API.graphql(graphqlOperation(onDeleteNote)).subscribe({
      next: noteData => {
        const deletedNote = noteData.value.data.onDeleteNote;
        setState( prevState => {
          const prevNotes = [...prevState.notes].filter( note => note.id !== deletedNote.id ); 
          return { ...prevState, notes: prevNotes }
        })
      }
    })

    // THIS WILL SUBSCRIBE TO ONUPDATE
    const updateNoteListener = API.graphql(graphqlOperation(onUpdateNote)).subscribe({
      next: noteData => {
        const updatedNote = noteData.value.data.onUpdateNote;
        setState( prevState => { // ALGORITHM BELOW SWAPS THE NOTE AT THE EXACT PREVIOUS INDEX
          const index = _.findIndex([...prevState.notes], { id: updatedNote.id });
          const updatedNotes = [ ...prevState.notes.slice(0, index), updatedNote, ...prevState.notes.slice(index + 1)]
          return { ...prevState, notes: updatedNotes  }
        })
      }
    })

    return () => { // MIMICS CWU - DOES CLEANUP
      createNoteListener.unsubscribe();
      deleteNoteListener.unsubscribe();
      updateNoteListener.unsubscribe();
    }
  }, []) // MIMICS CDM

  async function handleSubmit(ev){
    ev.preventDefault();
    // IF THERE IS AN ID : CALLS UPDATE >> ELSE : CALLS CREATE
    if( state.id ) {
      await API.graphql(graphqlOperation(updateNote, { 
        input: { id: state.id, note: state.note }
      }))
      setState({ ...state, id: '', note: '' })
    } else {
      await API.graphql(graphqlOperation(createNote, { 
        input: { note: state.note }
      }))
      setState({ ...state, note: '' })
    }
  // __NO NEED TO SPREAD IN THE NEW NOTE INSTANCE ON UPDATE/CREATE >> REALTIME DOES THIS
  }

  // JUST CALLS THE API AND RESETS STATE
  async function handleDelete(noteId){
    await API.graphql(graphqlOperation(deleteNote, { 
      input: { id: noteId }
    }))
    setState({ ...state, note: '' })
  }

  return (
    <div className="flex flex-column items-center justify-center pa3 bg-washed-red">
      <h1 className="code f2-l">Amplify Note Taker</h1>
      <form className="mb3" onSubmit={handleSubmit}>
        <input type="text" value={state.note} className="pa2 f4" placeholder="write you note" onChange={ e => setState({ ...state, note: e.target.value }) }/>
        <button type="submit" className="pa2 f4">{state.id ? 'Update Note' : 'Add Note' }</button>
      </form>
      <div>
        { state.notes ? state.notes.map( item => 
          <div key={item.id} className="flex items-center">
            <li onClick={() => setState({ ...state, note: item.note, id: item.id })} className="list pa1t f3">{`${item.note}`}</li>
            <button className="bg-transparent bn f4" onClick={() => handleDelete(item.id)}><span>&times;</span></button>
          </div>
        ): null}
      </div>
    </div>
  );
}

export default withAuthenticator(App, { includeGreetings: true });