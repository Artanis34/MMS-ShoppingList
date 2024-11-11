import React, { useState, useEffect, useRef } from "react";
import { View, Text, TextInput, Button, FlatList, StyleSheet, Modal, TouchableOpacity, Alert, CheckBox } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { useFocusEffect } from '@react-navigation/native';

enum Group {
  Undefined = 0,
  Vegetables,
  Meat,
  Dairy,
  Grains
}

interface Item {
    id: number,
    name: string,
    completed: boolean,
    group: Group
}

interface ShoppingList {
    id: number,
    name: string,
    items: Item[]
  }

export default function HomeScreen() {
  const [items, setItems] = useState<Item[]>([]);
  const [itemName, setItemName] = useState('');
  const [itemGroup, setItemGroup] = useState<Group>(Group.Undefined);
  const [modalVisible, setModalVisible] = useState(false);
  const [removeVisible, setRemoveVisible] = useState<Item>();
  const [listName, setListName] = useState('Shopping List');
  const flatListRef = useRef<FlatList>(null);

  //load list
  useFocusEffect(
    React.useCallback(() => {
      const storedLists = localStorage.getItem('shoppingLists');
      const defaultList = localStorage.getItem('defaultListId');

      if (storedLists && defaultList) {
          const defaultId = JSON.parse(defaultList);
          const sL = JSON.parse(storedLists).find(item => item.id == defaultId);
          if (sL) {
              setItems(sL.items);
              setListName(sL.name);
          }
      } else {
        const exampleItems: Item[] = [
          { id: 1, name: 'Tomatoes', completed: false, group: Group.Vegetables },
          { id: 2, name: 'Chicken Breast', completed: false, group: Group.Meat },
          { id: 3, name: 'Milk', completed: false, group: Group.Dairy },
          { id: 4, name: 'Bread', completed: false, group: Group.Grains }
        ];
        const exampleList: ShoppingList = { id: Date.now(), name: 'Example Grocery List', items: exampleItems };
        localStorage.setItem('shoppingLists', JSON.stringify([exampleList]));
        localStorage.setItem('defaultListId', JSON.stringify(exampleList.id));
        setItems(exampleItems);
        setListName(exampleList.name);
      }
    }, [])
  );

  //save list
  useEffect(() => {
      const storedLists = localStorage.getItem('shoppingLists');
      const defaultList = localStorage.getItem('defaultListId');
      if (storedLists && defaultList) {
          const defaultId = JSON.parse(defaultList);
          const lists = JSON.parse(storedLists);
          const updatedLists = lists.map(list => 
              list.id === defaultId ? { ...list, items } : list
          );
          localStorage.setItem('shoppingLists', JSON.stringify(updatedLists));
          localStorage.setItem('updated', '1');
      } else {
          const id = Date.now()
          const lists: ShoppingList[] = [{id: id, name: listName, items: items}];

          localStorage.setItem('shoppingLists', JSON.stringify(lists));
          localStorage.setItem('defaultListId',JSON.stringify(id));
          localStorage.setItem('updated', '1');
      }

  }, [items]);

  const addItem = () => {
      if (itemName.trim()) {
          setItems([...items, {id: Date.now(), name: itemName, completed: false, group: itemGroup}].sort((a, b) => a.group - b.group));
          setItemName('');
          setModalVisible(false);
      }
  }

  const toggleItemCompletion = (id: number) => {
      const updatedItems = items.map(item => 
          item.id === id ? { ...item, completed: !item.completed } : item
      ).sort((a, b) => a.group - b.group);
      setItems(updatedItems);
  }

  const removeItem = (id:number) => {
      setRemoveVisible(undefined);
      setItems(items.filter(item => item.id !== id));
      
  }

  const getNextUncompletedItem = () => {
    return items.find(item => !item.completed);
  };

  const scrollToNextItem = () => {
    const nextItemIndex = items.findIndex(item => !item.completed);
    if (nextItemIndex !== -1 && flatListRef.current) {
      flatListRef.current.scrollToIndex({ index: nextItemIndex, animated: true });
    }
  };

  return (
      <View style={styles.container}>
          <Text style={styles.title}>{listName}</Text>
          <TouchableOpacity
              style={styles.addButton}
              onPress={() => setModalVisible(true)}
          >
              <Text style={styles.addButtonText}>+</Text>
          </TouchableOpacity>

          <FlatList
              ref={flatListRef}
              data={items}
              keyExtractor={item => item.id.toString()}
              renderItem={({ item }) => (
                  <View style={styles.item}>
                      <CheckBox
                          value={item.completed}
                          onValueChange={() => toggleItemCompletion(item.id)}
                      />
                      <Text style={item.completed ? styles.completedItem : undefined}>{item.name}</Text>
                      <Text style={styles.groupText}>{Group[item.group]}</Text>
                      <Button title="Remove" onPress={() => setRemoveVisible(item)} />
                  </View>
              )}
          />

          {getNextUncompletedItem() && (
            <View style={styles.currentItemContainer}>
              <Text style={styles.currentItemText}>
                Next: {getNextUncompletedItem()?.name}
              </Text>
              <Button
                title="Mark as Completed"
                color='green'
                onPress={() => {
                  toggleItemCompletion(getNextUncompletedItem()?.id);
                  scrollToNextItem();
                }}
              />
            </View>
          )}

          <Modal
              
              transparent={true}
              visible={modalVisible}
              onRequestClose={() => setModalVisible(false)}    
          >
              <View style={styles.modalContainer}>
                  <Text style={styles.modalTitle}>Add New Item</Text>
                  <TextInput
                      style={styles.input}
                      placeholder="Item name"
                      value={itemName}
                      onChangeText={setItemName}
                  />
                  <Picker
                      selectedValue={itemGroup}
                      onValueChange={(itemValue) => setItemGroup(itemValue)}
                  >
                      {Object.keys(Group)
                          .filter(key => isNaN(Number(key)))
                          .map((key, index) => (
                              <Picker.Item key={index} label={key} value={Group[key as keyof typeof Group]} />
                          ))
                      }
                  </Picker>
                  <Button title="Add Item" onPress={addItem} />
                  <Button title="Cancel" onPress={() => setModalVisible(false)} />
              </View>
          </Modal>
          <Modal
              
              transparent={true}
              visible={removeVisible !== undefined}
              onRequestClose={() => setRemoveVisible(undefined)}    
          >
              <View style={styles.modalContainer}>
                  <Text style={styles.modalTitle}>Delete Item</Text>
                  <Text>{removeVisible?.name}</Text>
                  <View style={styles.buttonRow}>
                  <Button title="Delete" onPress={() => removeItem(removeVisible?.id)} color="red" />
                    <Button title="Cancel" onPress={() => setRemoveVisible(undefined)} />
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
});