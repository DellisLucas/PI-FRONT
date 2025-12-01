import { Layout } from '@/components/Layout';
import { Feather } from '@expo/vector-icons';
import axios from 'axios';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

type Product = {
  id?: string;
  code: string;
  name: string;
  description?: string;
  brand?: string;
  category?: string;
  color?: string;
  size?: string;
  material?: string;
  quantity: number;
  unitCost: number;
  salePrice: number;
};

const API_BASE_URL = 'https://pi-02-sem-2024.onrender.com';

export default function EstoqueScreen() {
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [currentProduct, setCurrentProduct] = useState<Product | null>(null);

  const [newProduct, setNewProduct] = useState<Product>({
    code: '',
    name: '',
    description: '',
    brand: '',
    category: '',
    color: '',
    size: '',
    material: '',
    quantity: 0,
    unitCost: 0,
    salePrice: 0,
  });

  const fetchProducts = async () => {
    try {
      setLoading(true);

      const response = await axios.get<Product[]>(`${API_BASE_URL}/stock`);

      const data = Array.isArray(response.data) ? response.data : [];
      setProducts(data);
      setFilteredProducts(data);
    } catch (error: any) {
      console.error('Erro ao buscar produtos:', error);
      setProducts([]);
      setFilteredProducts([]);
      Alert.alert('Erro', 'Não foi possível carregar o estoque.');
    } finally {
      setLoading(false);
    }
  };

  const filterProducts = (term: string, list: Product[]) => {
    const searchLower = term.toLowerCase();
    const filtered = list.filter((product) => {
      return (
        product.name?.toLowerCase().includes(searchLower) ||
        product.code?.toLowerCase().includes(searchLower) ||
        product.brand?.toLowerCase().includes(searchLower) ||
        product.category?.toLowerCase().includes(searchLower)
      );
    });
    setFilteredProducts(filtered);
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  useEffect(() => {
    filterProducts(searchTerm, products);
  }, [searchTerm, products]);

  const openEditModal = (product: Product) => {
    setCurrentProduct(product);
    setIsEditModalOpen(true);
  };

  const closeEditModal = () => {
    setIsEditModalOpen(false);
    setCurrentProduct(null);
  };

  const handleUpdateProduct = async () => {
    if (!currentProduct?.id) {
      Alert.alert('Erro', 'Produto inválido para edição.');
      return;
    }

    try {
      const response = await axios.put<Product>(
        `${API_BASE_URL}/stock/${currentProduct.id}`,
        currentProduct,
      );

      const updated = products.map((p) =>
        p.id === currentProduct.id ? response.data : p,
      );
      setProducts(updated);
      setFilteredProducts(updated);
      closeEditModal();
      Alert.alert('Sucesso', 'Produto atualizado com sucesso!');
    } catch (error) {
      console.error('Erro ao atualizar produto:', error);
      Alert.alert('Erro', 'Não foi possível atualizar o produto.');
    }
  };

  const confirmDeleteProduct = (product: Product) => {
    Alert.alert(
      'Excluir produto',
      `Tem certeza que deseja excluir o produto "${product.name}"?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Excluir', style: 'destructive', onPress: () => handleDeleteProduct(product) },
      ],
    );
  };

  const handleDeleteProduct = async (product: Product) => {
    if (!product.id) {
      Alert.alert('Erro', 'Produto inválido para exclusão.');
      return;
    }

    try {
      await axios.delete(`${API_BASE_URL}/stock/${product.id}`);

      const updated = products.filter((p) => p.id !== product.id);
      setProducts(updated);
      setFilteredProducts(updated);
      Alert.alert('Sucesso', 'Produto excluído com sucesso!');
    } catch (error) {
      console.error('Erro ao excluir produto:', error);
      Alert.alert('Erro', 'Não foi possível excluir o produto.');
    }
  };

  const openAddModal = () => {
    setNewProduct({
      code: '',
      name: '',
      description: '',
      brand: '',
      category: '',
      color: '',
      size: '',
      material: '',
      quantity: 0,
      unitCost: 0,
      salePrice: 0,
    });
    setIsAddModalOpen(true);
  };

  const closeAddModal = () => {
    setIsAddModalOpen(false);
  };

  const handleAddProduct = async () => {
    if (!newProduct.name || !newProduct.code) {
      Alert.alert('Atenção', 'Preencha pelo menos código e nome do produto.');
      return;
    }

    try {
      const response = await axios.post<Product>(
        `${API_BASE_URL}/stock`,
        newProduct,
      );

      const created = response.data;
      const updated = [...products, created];
      setProducts(updated);
      setFilteredProducts(updated);
      closeAddModal();
      Alert.alert('Sucesso', 'Produto adicionado com sucesso!');
    } catch (error) {
      console.error('Erro ao adicionar produto:', error);
      Alert.alert('Erro', 'Não foi possível adicionar o produto.');
    }
  };

  const totalStockValue = filteredProducts.reduce(
    (acc, product) => acc + (product.unitCost || 0) * (product.quantity || 0),
    0,
  );

  const totalSaleValue = filteredProducts.reduce(
    (acc, product) => acc + (product.salePrice || 0) * (product.quantity || 0),
    0,
  );

  const renderItem = ({ item }: { item: Product }) => (
    <TouchableOpacity
      style={styles.card}
      activeOpacity={0.8}
      onPress={() => openEditModal(item)}
    >
      <View style={styles.cardHeader}>
        <Text style={styles.cardTitle}>{item.name || '-'}</Text>
        <Text style={styles.cardCode}>{item.code || '-'}</Text>
      </View>
      {!!item.brand && <Text style={styles.cardText}>Marca: {item.brand}</Text>}
      {!!item.category && <Text style={styles.cardText}>Categoria: {item.category}</Text>}
      <View style={styles.cardRow}>
        <Text style={styles.cardBadge}>Qtd: {item.quantity || 0}</Text>
        <Text style={styles.cardBadge}>
          Custo: R$ {(item.unitCost || 0).toFixed(2)}
        </Text>
        <Text style={styles.cardBadge}>
          Venda: R$ {(item.salePrice || 0).toFixed(2)}
        </Text>
      </View>
      <View style={styles.cardActions}>
        <TouchableOpacity
          style={[styles.actionButton, styles.editButton]}
          onPress={() => openEditModal(item)}
        >
          <Feather name="edit-2" size={16} color="#fff" />
          <Text style={styles.actionText}>Editar</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.actionButton, styles.deleteButton]}
          onPress={() => confirmDeleteProduct(item)}
        >
          <Feather name="trash-2" size={16} color="#fff" />
          <Text style={styles.actionText}>Excluir</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

  return (
    <Layout>
      <View style={styles.container}>
        <Text style={styles.title}>Estoque</Text>

        <View style={styles.summaryContainer}>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>Total de Produtos</Text>
            <Text style={styles.summaryValue}>{filteredProducts.length}</Text>
          </View>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>Valor do Estoque</Text>
            <Text style={styles.summaryValue}>
              R$ {totalStockValue.toFixed(2)}
            </Text>
          </View>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>Valor de Venda</Text>
            <Text style={styles.summaryValue}>
              R$ {totalSaleValue.toFixed(2)}
            </Text>
          </View>
        </View>

        <View style={styles.searchRow}>
          <View style={styles.searchContainer}>
            <Feather name="search" size={18} color="#888" style={styles.searchIcon} />
            <TextInput
              placeholder="Buscar por nome, código, marca ou categoria..."
              placeholderTextColor="#888"
              style={styles.searchInput}
              value={searchTerm}
              onChangeText={setSearchTerm}
            />
          </View>
          <TouchableOpacity style={styles.addButton} onPress={openAddModal}>
            <Feather name="plus" size={20} color="#fff" />
            <Text style={styles.addButtonText}>Adicionar</Text>
          </TouchableOpacity>
        </View>

        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#7b2ff2" />
          </View>
        ) : filteredProducts.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>Nenhum produto encontrado.</Text>
          </View>
        ) : (
          <FlatList
            data={filteredProducts}
            keyExtractor={(item, index) => item.id ?? `${item.code}-${index}`}
            renderItem={renderItem}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
          />
        )}

        {/* Modal de edição */}
        <Modal
          visible={isEditModalOpen}
          animationType="slide"
          transparent
          onRequestClose={closeEditModal}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <ScrollView>
                <Text style={styles.modalTitle}>Editar Produto</Text>

                <Text style={styles.inputLabel}>Código</Text>
                <TextInput
                  style={[styles.input, styles.inputDisabled]}
                  value={currentProduct?.code || ''}
                  editable={false}
                />

                <Text style={styles.inputLabel}>Nome</Text>
                <TextInput
                  style={styles.input}
                  value={currentProduct?.name || ''}
                  onChangeText={(text) =>
                    setCurrentProduct((prev) =>
                      prev ? { ...prev, name: text } : prev,
                    )
                  }
                />

                <Text style={styles.inputLabel}>Descrição</Text>
                <TextInput
                  style={[styles.input, styles.inputMultiline]}
                  multiline
                  value={currentProduct?.description || ''}
                  onChangeText={(text) =>
                    setCurrentProduct((prev) =>
                      prev ? { ...prev, description: text } : prev,
                    )
                  }
                />

                <Text style={styles.inputLabel}>Marca</Text>
                <TextInput
                  style={styles.input}
                  value={currentProduct?.brand || ''}
                  onChangeText={(text) =>
                    setCurrentProduct((prev) =>
                      prev ? { ...prev, brand: text } : prev,
                    )
                  }
                />

                <Text style={styles.inputLabel}>Categoria</Text>
                <TextInput
                  style={styles.input}
                  value={currentProduct?.category || ''}
                  onChangeText={(text) =>
                    setCurrentProduct((prev) =>
                      prev ? { ...prev, category: text } : prev,
                    )
                  }
                />

                <Text style={styles.inputLabel}>Cor</Text>
                <TextInput
                  style={styles.input}
                  value={currentProduct?.color || ''}
                  onChangeText={(text) =>
                    setCurrentProduct((prev) =>
                      prev ? { ...prev, color: text } : prev,
                    )
                  }
                />

                <Text style={styles.inputLabel}>Tamanho</Text>
                <TextInput
                  style={styles.input}
                  value={currentProduct?.size || ''}
                  onChangeText={(text) =>
                    setCurrentProduct((prev) =>
                      prev ? { ...prev, size: text } : prev,
                    )
                  }
                />

                <Text style={styles.inputLabel}>Material</Text>
                <TextInput
                  style={styles.input}
                  value={currentProduct?.material || ''}
                  onChangeText={(text) =>
                    setCurrentProduct((prev) =>
                      prev ? { ...prev, material: text } : prev,
                    )
                  }
                />

                <View style={styles.rowInputs}>
                  <View style={styles.rowInputItem}>
                    <Text style={styles.inputLabel}>Quantidade</Text>
                    <TextInput
                      style={styles.input}
                      keyboardType="numeric"
                      value={
                        currentProduct?.quantity !== undefined
                          ? String(currentProduct.quantity)
                          : '0'
                      }
                      onChangeText={(text) =>
                        setCurrentProduct((prev) =>
                          prev
                            ? {
                                ...prev,
                                quantity: Number(text) || 0,
                              }
                            : prev,
                        )
                      }
                    />
                  </View>
                  <View style={styles.rowInputItem}>
                    <Text style={styles.inputLabel}>Custo Unitário (R$)</Text>
                    <TextInput
                      style={styles.input}
                      keyboardType="numeric"
                      value={
                        currentProduct?.unitCost !== undefined
                          ? String(currentProduct.unitCost)
                          : '0'
                      }
                      onChangeText={(text) =>
                        setCurrentProduct((prev) =>
                          prev
                            ? {
                                ...prev,
                                unitCost: Number(text) || 0,
                              }
                            : prev,
                        )
                      }
                    />
                  </View>
                </View>

                <Text style={styles.inputLabel}>Preço de Venda (R$)</Text>
                <TextInput
                  style={styles.input}
                  keyboardType="numeric"
                  value={
                    currentProduct?.salePrice !== undefined
                      ? String(currentProduct.salePrice)
                      : '0'
                  }
                  onChangeText={(text) =>
                    setCurrentProduct((prev) =>
                      prev
                        ? {
                            ...prev,
                            salePrice: Number(text) || 0,
                          }
                        : prev,
                    )
                  }
                />

                <View style={styles.modalActions}>
                  <TouchableOpacity
                    style={[styles.modalButton, styles.saveButton]}
                    onPress={handleUpdateProduct}
                  >
                    <Text style={styles.modalButtonText}>Salvar</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.modalButton, styles.cancelButton]}
                    onPress={closeEditModal}
                  >
                    <Text style={styles.modalButtonText}>Cancelar</Text>
                  </TouchableOpacity>
                </View>
              </ScrollView>
            </View>
          </View>
        </Modal>

        {/* Modal de adicionar */}
        <Modal
          visible={isAddModalOpen}
          animationType="slide"
          transparent
          onRequestClose={closeAddModal}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <ScrollView>
                <Text style={styles.modalTitle}>Adicionar Produto</Text>

                <Text style={styles.inputLabel}>Código</Text>
                <TextInput
                  style={styles.input}
                  value={newProduct.code}
                  onChangeText={(text) =>
                    setNewProduct((prev) => ({ ...prev, code: text }))
                  }
                />

                <Text style={styles.inputLabel}>Nome</Text>
                <TextInput
                  style={styles.input}
                  value={newProduct.name}
                  onChangeText={(text) =>
                    setNewProduct((prev) => ({ ...prev, name: text }))
                  }
                />

                <Text style={styles.inputLabel}>Descrição</Text>
                <TextInput
                  style={[styles.input, styles.inputMultiline]}
                  multiline
                  value={newProduct.description}
                  onChangeText={(text) =>
                    setNewProduct((prev) => ({ ...prev, description: text }))
                  }
                />

                <Text style={styles.inputLabel}>Marca</Text>
                <TextInput
                  style={styles.input}
                  value={newProduct.brand}
                  onChangeText={(text) =>
                    setNewProduct((prev) => ({ ...prev, brand: text }))
                  }
                />

                <Text style={styles.inputLabel}>Categoria</Text>
                <TextInput
                  style={styles.input}
                  value={newProduct.category}
                  onChangeText={(text) =>
                    setNewProduct((prev) => ({ ...prev, category: text }))
                  }
                />

                <Text style={styles.inputLabel}>Cor</Text>
                <TextInput
                  style={styles.input}
                  value={newProduct.color}
                  onChangeText={(text) =>
                    setNewProduct((prev) => ({ ...prev, color: text }))
                  }
                />

                <Text style={styles.inputLabel}>Tamanho</Text>
                <TextInput
                  style={styles.input}
                  value={newProduct.size}
                  onChangeText={(text) =>
                    setNewProduct((prev) => ({ ...prev, size: text }))
                  }
                />

                <Text style={styles.inputLabel}>Material</Text>
                <TextInput
                  style={styles.input}
                  value={newProduct.material}
                  onChangeText={(text) =>
                    setNewProduct((prev) => ({ ...prev, material: text }))
                  }
                />

                <View style={styles.rowInputs}>
                  <View style={styles.rowInputItem}>
                    <Text style={styles.inputLabel}>Quantidade</Text>
                    <TextInput
                      style={styles.input}
                      keyboardType="numeric"
                      value={String(newProduct.quantity)}
                      onChangeText={(text) =>
                        setNewProduct((prev) => ({
                          ...prev,
                          quantity: Number(text) || 0,
                        }))
                      }
                    />
                  </View>
                  <View style={styles.rowInputItem}>
                    <Text style={styles.inputLabel}>Custo Unitário (R$)</Text>
                    <TextInput
                      style={styles.input}
                      keyboardType="numeric"
                      value={String(newProduct.unitCost)}
                      onChangeText={(text) =>
                        setNewProduct((prev) => ({
                          ...prev,
                          unitCost: Number(text) || 0,
                        }))
                      }
                    />
                  </View>
                </View>

                <Text style={styles.inputLabel}>Preço de Venda (R$)</Text>
                <TextInput
                  style={styles.input}
                  keyboardType="numeric"
                  value={String(newProduct.salePrice)}
                  onChangeText={(text) =>
                    setNewProduct((prev) => ({
                      ...prev,
                      salePrice: Number(text) || 0,
                    }))
                  }
                />

                <View style={styles.modalActions}>
                  <TouchableOpacity
                    style={[styles.modalButton, styles.saveButton]}
                    onPress={handleAddProduct}
                  >
                    <Text style={styles.modalButtonText}>Adicionar</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.modalButton, styles.cancelButton]}
                    onPress={closeAddModal}
                  >
                    <Text style={styles.modalButtonText}>Cancelar</Text>
                  </TouchableOpacity>
                </View>
              </ScrollView>
            </View>
          </View>
        </Modal>
      </View>
    </Layout>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#f5f5f5',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
    color: '#7b2ff2',
  },
  summaryContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  summaryItem: {
    flex: 1,
    marginHorizontal: 4,
  },
  summaryLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  searchContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginRight: 8,
  },
  searchIcon: {
    marginRight: 4,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: '#333',
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#7b2ff2',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  addButtonText: {
    color: '#fff',
    marginLeft: 6,
    fontWeight: 'bold',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 14,
    color: '#666',
  },
  listContent: {
    paddingBottom: 24,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
    marginRight: 8,
  },
  cardCode: {
    fontSize: 12,
    color: '#888',
  },
  cardText: {
    fontSize: 13,
    color: '#555',
    marginBottom: 2,
  },
  cardRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 6,
  },
  cardBadge: {
    fontSize: 12,
    color: '#333',
    backgroundColor: '#f0f0ff',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    marginRight: 6,
    marginBottom: 4,
  },
  cardActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 8,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    marginLeft: 8,
  },
  editButton: {
    backgroundColor: '#7b2ff2',
  },
  deleteButton: {
    backgroundColor: '#ff6b6b',
  },
  actionText: {
    color: '#fff',
    marginLeft: 4,
    fontSize: 12,
    fontWeight: 'bold',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    width: '90%',
    maxWidth: 500,
    maxHeight: '85%',
    alignSelf: 'center',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 12,
    textAlign: 'center',
    color: '#7b2ff2',
  },
  inputLabel: {
    fontSize: 12,
    color: '#555',
    marginTop: 8,
    marginBottom: 4,
  },
  input: {
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    fontSize: 14,
    color: '#333',
  },
  inputDisabled: {
    backgroundColor: '#e0e0e0',
  },
  inputMultiline: {
    minHeight: 70,
    textAlignVertical: 'top',
  },
  rowInputs: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
  },
  rowInputItem: {
    flex: 1,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
    gap: 8,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
  },
  saveButton: {
    backgroundColor: '#7b2ff2',
  },
  cancelButton: {
    backgroundColor: '#999',
  },
  modalButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
  },
});


