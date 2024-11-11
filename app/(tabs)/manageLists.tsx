import React, {useState, useEffect } from 'react';
import { View, Text, TextInput, Button, FlatList, StyleSheet, Modal, TouchableOpacity, Alert, CheckBox } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';

interface Item {
  id: number,
  name: string,
  completed: boolean,
  group: number
}

interface ShoppingList {
  id: number,
  name: string,
  items: Item[]
}

export default function ManageLists() {

    const [newListVisible, setNewListVisible] = useState(false);
    const [editVisible, setEditVisible] = useState<ShoppingList>();
    const [confirmDelete, setConfirmDelete] = useState(false);
    const [confirmReset, setconfirmReset] = useState(false);
    
    const [lists, setLists] = useState<ShoppingList[]>([]);
    const [defaultListId, setDefaultListId] = useState<number | null>(null);
    const [newListName, setNewListName] = useState('');

    //load lists from storage
    useEffect(() => {
        const storedLists = localStorage.getItem('shoppingLists');
        const storedDefaultListId = localStorage.getItem('defaultListId');
        //const defaultList = localStorage.getItem('list');

        if(storedLists) {
            setLists(JSON.parse(storedLists));
        }

        if (storedDefaultListId) {
            setDefaultListId(JSON.parse(storedDefaultListId))
        } 

    }, [])

    useFocusEffect(
        React.useCallback(() => {
            if (localStorage.getItem('updated') === '1') {
                localStorage.setItem('updated', '0');
                const storedLists = localStorage.getItem('shoppingLists');
                if (storedLists) {
                    setLists(JSON.parse(storedLists));
                }
            }
        }, [])
    );

    // save the lists
    useEffect(() => {
        localStorage.setItem('shoppingLists', JSON.stringify(lists));
    }, [lists]);

    // save default selection
    useEffect(() => {
        if (defaultListId !== null) {
            localStorage.setItem('defaultListId', JSON.stringify(defaultListId));
        }
    }, [defaultListId])

    useEffect(() => {
        if (editVisible === undefined) {
            setConfirmDelete(false);
            setconfirmReset(false);
        }
    }, [editVisible])

    const addNewList = () => {
        const newList: ShoppingList = {
            id: Date.now(),
            name: newListName,
            items: []
        };

        setLists([...lists, newList]);
        setNewListName('');
        setNewListVisible(false);
    };

    const deleteList = (id: number) => {

        if (defaultListId == id) {
            console.log("cannot delete default list");
        }
        setLists(lists.filter(list => list.id !== id));
        setEditVisible(undefined);

    };

    const resetList = (id: number) => {
        setLists(lists.map(list => {
            if (list.id === id) {
                return {
                    ...list,
                    items: list.items.map(item => ({
                        ...item,
                        completed: false
                    }))
                };
            }
            return list;
        }));
        setEditVisible(undefined);
    };

    const duplicateList = (id: number) => {
        const listToDuplicate = lists.find(list => list.id === id);
        if (listToDuplicate) {
            const duplicatedList = { ...listToDuplicate, id: Date.now() };
            setLists([...lists, duplicatedList]);
        }

        setEditVisible(undefined);
    };

    const makeDefault = (id: number) => {
        setDefaultListId(id);
        setEditVisible(undefined);
    }

    return (
    <View style={styles.container}>
        <Text style={styles.title}>Manage Lists</Text>
        <TouchableOpacity
            style={styles.addButton}
            onPress={() => setNewListVisible(true)}
        >
            <Text style={styles.addButtonText}>+</Text>
        </TouchableOpacity>

        <FlatList
            data={lists}
            keyExtractor={list => list.id.toString()}
            renderItem={({ item }) => {
                const completedItems = item.items.filter(i => i.completed).length;
                return (
                    <View style={styles.item}>
                        <Text>{item.name}</Text>
                        {item.id === defaultListId && <Text style={styles.defaultText}>Selected</Text>}
                        {item.id !== defaultListId && <Text style={styles.defaultText}></Text>}
                        <Text style={styles.groupText}>{completedItems} / {item.items.length} items completed</Text>
                        <Button title="Edit" onPress={() => setEditVisible(item)} />
                    </View>
                );
            }}
        />

        

        <Modal
            
            transparent={true}
            visible={newListVisible}
            onRequestClose={() => setNewListVisible(false)}    
        >
            <View style={styles.modalContainer}>
                <Text style={styles.modalTitle}>Add New Item</Text>
                <TextInput
                    style={styles.input}
                    placeholder="Item name"
                    value={newListName}
                    onChangeText={setNewListName}
                />
               
                <Button title="Add Item" onPress={addNewList} />
                <Button title="Cancel" onPress={() => setNewListVisible(false)} />
            </View>
        </Modal>



        <Modal
            
            transparent={true}
            visible={editVisible !== undefined}
            onRequestClose={() => setEditVisible(undefined)}    
        >

            <View style={styles.modalContainer}>
                <Text style={styles.modalTitle}>Edit {editVisible?.name}</Text>
                <View style={styles.buttonRow}>
                    {editVisible?.id !== defaultListId ? (
                        <>
                            <Button title='Select' onPress={() => makeDefault(editVisible?.id)} />
                            <Button title="Delete" onPress={() => setConfirmDelete(true)} color="red" />
                            
                        </>
                    ) : (
                        <Button title='Selected' disabled={true} />
                    )}
                    <Button title="Reset" onPress={() => setconfirmReset(true)} color="orange" />
                    <Button title='Duplicate' onPress={() => duplicateList(editVisible?.id)} />
                    <Button title="Cancel" onPress={() => setEditVisible(undefined)} />
                </View>
            </View>   
        </Modal>

        <Modal
              
              transparent={true}
              visible={editVisible !== undefined && confirmDelete}
              onRequestClose={() => setEditVisible(undefined)}    
          >
              <View style={styles.modalContainer}>
                  <Text style={styles.modalTitle}>Do you really want to delete {editVisible?.name}</Text>
                  <View style={styles.buttonRow}>
                  <Button title="Delete" onPress={() => deleteList(editVisible?.id)} color="red" />
                    <Button title="Cancel" onPress={() => setEditVisible(undefined)} />
                  </View>
              </View>   
          </Modal>

          <Modal
              
              transparent={true}
              visible={editVisible !== undefined && confirmReset}
              onRequestClose={() => setEditVisible(undefined)}    
          >
              <View style={styles.modalContainer}>
                  <Text style={styles.modalTitle}>Do you really want to reset {editVisible?.name}</Text>
                  <Text>All the items get unchecked</Text>
                  <View style={styles.buttonRow}>
                    <Button title="Reset" onPress={() => resetList(editVisible?.id)} color="orange" />
                    <Button title="Cancel" onPress={() => setEditVisible(undefined)} />
                  </View>
              </View>   
          </Modal>
    </View>
    )
}

const styles = StyleSheet.create({
container: {
  flex: 1,
  padding: 20,
},
title: {
  fontSize: 24,
  fontWeight: 'bold',
  marginBottom: 20,
},
addButton: {
  position: 'absolute',
  top: 20,
  right: 20,
  backgroundColor: '#007BFF',
  borderRadius: 50,
  width: 40,
  height: 40,
  justifyContent: 'center',
  alignItems: 'center',
},
addButtonText: {
  color: 'white',
  fontSize: 24,
},
item: {
  flexDirection: 'row',
  justifyContent: 'space-between',
  alignItems: 'center',
  padding: 10,
  borderBottomWidth: 1,
  borderBottomColor: '#ccc',
},
modalContainer: {
  flex: 1,
  justifyContent: 'center',
  alignItems: 'center',
  backgroundColor: 'rgba(255,255,255,0.9)',
},
modalView: {
  width: 300,
  padding: 20,
  backgroundColor: 'white',
  borderRadius: 10,
  alignItems: 'center',
},
modalTitle: {
  fontSize: 20,
  marginBottom: 20,
},
input: {
  borderWidth: 1,
  borderColor: '#ccc',
  padding: 10,
  marginBottom: 10,
  width: '100%',
},
buttonRow: {
  flexDirection: 'row',
  justifyContent: 'center',
  width:' 100%',
},
completedItem: {
  textDecorationLine: 'line-through',
  color: 'gray',
},
currentItemContainer: {
  padding: 10,
  backgroundColor: '#f8f8f8',
  borderTopWidth: 1,
  borderTopColor: '#ccc',
  alignItems: 'center',
},
currentItemText: {
  fontSize: 18,
  fontWeight: 'bold',
},
groupText: {
  marginLeft: 10,
  fontStyle: 'italic',
  color: 'gray',
},
defaultText: {
  color: 'green',
  fontWeight: 'bold',
},
});