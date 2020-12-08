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
      const storageProducts = await AsyncStorage.getItem('@GoMarketPlace');
      if (storageProducts) {
        setProducts(JSON.parse(storageProducts));
      }
    }

    loadProducts();
  }, []);

  const addToCart = useCallback(
    async (product: Omit<Product, 'quantity'>) => {
      const exists = products.find(p => p.id === product.id);

      if (exists) {
        setProducts(p =>
          p.map(pr =>
            pr.id === product.id ? { ...pr, quantity: pr.quantity + 1 } : pr,
          ),
        );
      } else {
        setProducts([...products, { ...product, quantity: 1 }]);
      }
      await AsyncStorage.setItem('@GoMarketPlace', JSON.stringify(products));
    },
    [products],
  );

  const increment = useCallback(
    async id => {
      setProducts(p =>
        p.map(pr => (pr.id === id ? { ...pr, quantity: pr.quantity + 1 } : pr)),
      );
      await AsyncStorage.setItem('@GoMarketPlace', JSON.stringify(products));
    },
    [products],
  );

  const decrement = useCallback(
    async id => {
      const product = products.find(p => p.id === id);
      if (product?.quantity === 1) {
        setProducts(p => p.filter(pr => pr.id !== id));
      } else {
        setProducts(p =>
          p.map(pr =>
            pr.id === id ? { ...pr, quantity: pr.quantity - 1 } : pr,
          ),
        );
      }
      await AsyncStorage.setItem('@GoMarketPlace', JSON.stringify(products));
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
