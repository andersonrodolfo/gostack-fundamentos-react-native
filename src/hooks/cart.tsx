import React, {
  createContext,
  useState,
  useCallback,
  useContext,
  useEffect,
} from 'react';

import AsyncStorage from '@react-native-community/async-storage';

interface Product {
  id: string;
  title: string;
  image_url: string;
  price: number;
  quantity: number;
}

interface CartContext {
  products: Product[];
  addToCart(item: Omit<Product, 'quantity'>): void;
  increment(id: string): void;
  decrement(id: string): void;
}

const CartContext = createContext<CartContext | null>(null);

const CartProvider: React.FC = ({ children }) => {
  const [products, setProducts] = useState<Product[]>([]);

  useEffect(() => {
    async function loadProducts(): Promise<void> {
      const productList = await AsyncStorage.getItem('@GoMarketplace:products');
      if (productList) setProducts(JSON.parse(productList));
    }

    loadProducts();
  }, []);

  const increment = useCallback(
    async id => {
      const productIndex = products.findIndex(item => item.id === id);
      const productList = [...products];
      productList[productIndex] = {
        ...productList[productIndex],
        quantity: productList[productIndex].quantity += 1,
      };

      await AsyncStorage.setItem(
        '@GoMarketplace:products',
        JSON.stringify(productList),
      );

      setProducts(productList);
    },
    [products],
  );

  const addToCart = useCallback(
    async product => {
      const { id } = product;
      if (products.find(item => item.id === id)) {
        increment(id);
        return;
      }
      const productList = [...products, { ...product, quantity: 1 }];
      await AsyncStorage.setItem(
        '@GoMarketplace:products',
        JSON.stringify(productList),
      );

      setProducts(productList);
    },
    [increment, products],
  );

  const decrement = useCallback(
    async id => {
      const productIndex = products.findIndex(item => item.id === id);
      const productList = [...products];
      productList[productIndex] = {
        ...productList[productIndex],
        quantity: productList[productIndex].quantity -= 1,
      };
      if (!productList[productIndex].quantity) {
        productList.splice(productIndex, 1);
      }

      await AsyncStorage.setItem(
        '@GoMarketplace:products',
        JSON.stringify(productList),
      );

      setProducts(productList);
    },
    [products],
  );

  const value = React.useMemo(
    () => ({ addToCart, increment, decrement, products }),
    [products, addToCart, increment, decrement],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};

function useCart(): CartContext {
  const context = useContext(CartContext);

  if (!context) {
    throw new Error(`useCart must be used within a CartProvider`);
  }

  return context;
}

export { CartProvider, useCart };
