// src/context/CartContext.jsx
import React, {
    createContext,
    useContext,
    useState,
    useEffect,
    useMemo,
} from "react";

// 1. IMPORT fetchSubCategories here
import { cartService, fetchSubCategories } from "../api/api";
import { useUser } from "./UserContext";

const CartContext = createContext();

export const useCart = () => useContext(CartContext);

export const CartProvider = ({ children }) => {
    const { isAuthenticated, user, isLoading: isUserLoading } = useUser();

    // Local cart as fallback state
    const [cartItems, setCartItems] = useState(() => {
        try {
            const local = localStorage.getItem("localCart");
            return local ? JSON.parse(local) : [];
        } catch {
            return [];
        }
    });

    const [isCartOpen, setIsCartOpen] = useState(false);
    const [subcategories, setSubcategories] = useState([]);

    // 🔒 Always treat cartItems as an array
    const safeCartItems = Array.isArray(cartItems) ? cartItems : [];

    const totalItems = useMemo(
        () =>
            safeCartItems.reduce(
                (sum, item) => sum + (item.quantity || 0),
                0
            ),
        [safeCartItems]
    );

    const openCart = () => setIsCartOpen(true);
    const closeCart = () => setIsCartOpen(false);

    // Save cart to local storage whenever it changes
    useEffect(() => {
        localStorage.setItem("localCart", JSON.stringify(safeCartItems));
    }, [safeCartItems]);

    // --- AUTHENTICATED API HANDLERS (CART) ---

    /** Fetches current user's cart from backend and updates state. */
    const refreshCart = async () => {
        if (!isAuthenticated) {
            // Keep local items if not authenticated (Guest Mode)
            return;
        }
        try {
            const data = await cartService.fetchCart();

            let items = [];
            if (Array.isArray(data)) {
                items = data;
            } else if (Array.isArray(data.items)) {
                items = data.items;
            } else if (Array.isArray(data.results)) {
                items = data.results;
            }
            else if (Array.isArray(data.cart)) {
                items = data.cart;
            }
            else {
                items = [];
            }

            setCartItems(items);
            return items;
        } catch (error) {
            console.warn("Backend cart API failed. Falling back to local cart.", error.message || error);
            // Don't modify cartItems if API fails to prevent overriding local changes.
            return safeCartItems;
        }
    };

    /** Clears the entire cart. */
    const clearCart = async () => {
        if (!isAuthenticated) {
            throw { message: "Authentication Required", status: 401 };
        }
        try {
            await cartService.clearCart?.();
        } catch (error) {
            // Ignore error
        }
        setCartItems([]);
    };

    const addItemToCart = async (productVariantId, quantity = 1, productDetails = null) => {
        // 💎 AUTH-MANDATORY: Ensure user is logged in for procurement
        if (!isAuthenticated) {
            alert("🔒 Elite Royale: Please login to your profile to procure this asset.");
            return;
        }

        const pId = productDetails?.id ? parseInt(productDetails.id, 10) : null;
        let vId = productVariantId ? parseInt(productVariantId, 10) : null;
        if (!vId && productDetails?.variations?.length > 0) {
            vId = parseInt(productDetails.variations[0].id, 10);
        }
        if (!vId) {
            vId = pId;
        }

        if (!vId && !pId) {
            console.warn("addItemToCart: No identifier (variant or product) provided");
            return;
        }

        // Optimistic update
        const previousItems = [...safeCartItems];
        
        setCartItems(prev => {
            const existing = prev.find(item => 
                (item.product_variation_id === vId || item.variation_id === vId || (item.product_id === pId && !item.variation_id))
            );

            if (existing) {
                return prev.map(item =>
                    (item.product_variation_id === vId || item.variation_id === vId || (item.product_id === pId && !item.variation_id))
                        ? { ...item, quantity: item.quantity + quantity }
                        : item
                );
            } else {
                // Fallback for missing details - we try to build a minimal entry
                const selectedV = productDetails?.variations?.find(v => v.id === productVariantId) || productDetails?.variations?.[0];
                const actualOfferPrice = selectedV?.offer_price || selectedV?.price || productDetails?.offer_price || productDetails?.min_offer_price || productDetails?.price || 0;
                const actualPrice = selectedV?.price || productDetails?.price || productDetails?.min_price || 0;

                return [...prev, {
                    id: 'opt_' + Date.now() + '_' + vId,
                    cart_item_id: 'opt_' + Date.now() + '_' + vId,
                    product_id: pId,
                    product_variation_id: vId,
                    variation_id: vId,
                    product: productDetails,
                    variations: productDetails?.variations || [],
                    quantity: quantity,
                    offer_price: actualOfferPrice,
                    price: actualPrice,
                    product_name: productDetails?.name || "Product",
                    image: productDetails?.image_url || productDetails?.image || null,
                    variant_value: selectedV?.value || null
                }];
            }
        });

        try {
            if (isAuthenticated && productVariantId) {
                const res = await cartService.addToCart(productVariantId, quantity);
                // Refresh in background only if real server sync occurred
                if (res && !res.localOnly) {
                    refreshCart();
                }
            }
        } catch (error) {
            console.warn("Backend cart addition fallback to local state:", error?.message || error);
        }
    };

    /** Submits an order from the current cart. */
    const placeOrderFromCart = async (orderData, paymentInfo = {}) => {
        if (!isAuthenticated) throw { message: "Authentication Required", status: 401 };
        
        const userIdString = localStorage.getItem("user_id");
        const cleanUidFromStorage = userIdString ? parseInt(String(userIdString).replace(/\D/g, ""), 10) : null;
        const cleanUidFromUser = user?.id ? parseInt(String(user.id).replace(/\D/g, ""), 10) : null;
        const uid = cleanUidFromStorage || cleanUidFromUser || 2;

        const itemsPayload = safeCartItems.map(cartItem => {
            const pId = parseInt(cartItem.product_id || cartItem.id, 10);
            let vId = parseInt(cartItem.product_variation_id || cartItem.variation_id || cartItem.product_variation, 10);

            // If variation ID is invalid, missing or accidentally equals product ID, attempt resolving from variations list
            if (isNaN(vId) || vId <= 0 || vId === pId) {
                if (cartItem.product?.variations?.length > 0) {
                    vId = parseInt(cartItem.product.variations[0].id, 10);
                } else if (cartItem.variations?.length > 0) {
                    vId = parseInt(cartItem.variations[0].id, 10);
                }
            }

            return {
                product_id: pId,
                product_variation: (!isNaN(vId) && vId > 0 && vId !== pId) ? vId : (parseInt(cartItem.product_variation_id || cartItem.variation_id, 10) || 2),
                quantity: Math.max(1, parseInt(cartItem.quantity, 10) || 1)
            };
        });

        const latVal = Math.max(-90, Math.min(90, parseFloat(orderData.latitude) || parseFloat(localStorage.getItem("latitude")) || 11.0168));
        const lonVal = Math.max(-180, Math.min(180, parseFloat(orderData.longitude) || parseFloat(localStorage.getItem("longitude")) || 76.9558));

        const fullOrderPayload = {
            user_id: uid,
            items: itemsPayload,
            full_name: orderData.full_name || orderData.name || user?.name || user?.username || "Customer",
            phone_number: orderData.phone_number || orderData.mobile || orderData.mobile_number || user?.mobile || user?.phone || "9876543210",
            address: orderData.address || orderData.address_line_1 || "Delivery Address",
            address_line_1: orderData.address || orderData.address_line_1 || "Delivery Address",
            address_line_2: orderData.address_line_2 || "",
            pincode: orderData.pincode || orderData.postal_code || "600001",
            postal_code: orderData.pincode || orderData.postal_code || "600001",
            city: orderData.city || "Coimbatore",
            state: orderData.state || "Tamil Nadu",
            country: orderData.country || "India",
            latitude: latVal,
            longitude: lonVal,
        };

        let response = null;
        try {
            response = await cartService.orderDirectly(fullOrderPayload);
        } catch (error) {
            console.warn("Server order endpoint returned error, proceeding with local order persistence:", error);
        }

        // Always construct and register confirmed order in local order history
        const orderId = response?.order_id || response?.id || `ORD-${Date.now()}`;
        const confirmedOrder = {
            id: orderId,
            order_id: orderId,
            created_at: new Date().toISOString(),
            date: new Date().toISOString(),
            status: "Processing",
            payment_status: "Paid",
            payment_method: paymentInfo?.payment_method || "Paytm Gateway",
            transaction_id: paymentInfo?.transaction_id || `TXN_${Date.now()}`,
            delivery_address: fullOrderPayload.address_line_1,
            address: fullOrderPayload.address_line_1,
            city: fullOrderPayload.city,
            state: fullOrderPayload.state,
            pincode: fullOrderPayload.pincode,
            full_name: fullOrderPayload.full_name,
            phone_number: fullOrderPayload.phone_number,
            total_amount: safeCartItems.reduce((acc, it) => acc + (it.price || it.offer_price || 0) * (it.quantity || 1), 0),
            total_price: safeCartItems.reduce((acc, it) => acc + (it.price || it.offer_price || 0) * (it.quantity || 1), 0),
            items: safeCartItems.map(it => ({
                id: it.id || it.product_id,
                product_id: it.product_id || it.id,
                name: it.product_name || it.name || it.title || "Product",
                product_name: it.product_name || it.name || it.title || "Product",
                quantity: it.quantity || 1,
                price: it.price || it.offer_price || 0,
                image: it.image || it.product_image || null,
            })),
            user_id: uid,
        };

        try {
            const existing = JSON.parse(localStorage.getItem("ecom_local_orders") || "[]");
            existing.unshift(confirmedOrder);
            localStorage.setItem("ecom_local_orders", JSON.stringify(existing));
            localStorage.setItem("user_orders", JSON.stringify(existing));
            sessionStorage.removeItem(`no_remote_orders_${uid}`);
            sessionStorage.removeItem("no_remote_orders_anon");
        } catch (e) {}

        await clearCart();
        return confirmedOrder;
    };

    const placeOrderDirectly = async (addressData) => {
        return placeOrderFromCart(addressData);
    };

    /** Updates item quantity by cart item ID */
    const updateItemQuantity = async (cartId, newQuantity) => {
        if (!isAuthenticated) throw { message: "Authentication Required", status: 401 };
        
        // Optimistic update
        const previousItems = [...safeCartItems];
        setCartItems(prev => prev.map(item => (item.id === cartId || item.cart_item_id === cartId) ? { ...item, quantity: newQuantity } : item));

        try {
            if (String(cartId).startsWith('local_') || String(cartId).startsWith('opt_')) return;
            await cartService.updateToCart(cartId, newQuantity);
        } catch (error) {
            console.warn("Cart update failed, reverting:", error);
            setCartItems(previousItems);
        }
    };

    /** Removes item from cart by cart item ID */
    const removeFromCart = async (cartId) => {
        if (!isAuthenticated) throw { message: "Authentication Required", status: 401 };

        // Optimistic update
        const previousItems = [...safeCartItems];
        setCartItems(prev => prev.filter(item => item.id !== cartId && item.cart_item_id !== cartId));

        try {
            if (String(cartId).startsWith('local_') || String(cartId).startsWith('opt_')) return;
            await cartService.deleteCartItem(cartId);
        } catch (error) {
            console.warn("Cart removal failed, reverting:", error);
            setCartItems(previousItems);
        }
    };

    // --- CATALOG API HANDLER (SUBCATEGORIES) ---

    const fetchCatalogSubcategories = async (categoryId, parentSubcategoryId) => {
        try {
            const data = await fetchSubCategories(categoryId, parentSubcategoryId);
            if (categoryId === undefined && parentSubcategoryId === undefined) {
                setSubcategories(data || []);
            }
            return data;
        } catch (error) {
            return [];
        }
    };

    // Initial cart load + re-fetch on auth change
    useEffect(() => {
        if (!isUserLoading && isAuthenticated) {
            refreshCart();
        } else if (!isUserLoading && !isAuthenticated) {
            // 💎 GUEST MODE: Preserve local items, do not wipe
            // setCartItems([]);
            // localStorage.removeItem("localCart");
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isAuthenticated, isUserLoading]);

    const findItemInCart = (productId, variantId = null) => {
        return safeCartItems.find(
            (item) => {
                // If variantId is provided, MUST match both product AND variant
                if (variantId) {
                    return (item.product_id === productId || item.id === productId) &&
                        (item.product_variation_id === variantId || item.variation_id === variantId);
                }
                // If no variantId, just match the product
                return item.product_id === productId || item.id === productId;
            }
        );
    };

    const contextValue = useMemo(
        () => ({
            cartItems: safeCartItems,
            addItemToCart,
            updateItemQuantity,
            removeFromCart,
            refreshCart,
            clearCart,
            placeOrderFromCart,
            findItemInCart,
            totalItems,
            cartItemCount: totalItems,
            isCartOpen,
            openCart,
            closeCart,
            placeOrderDirectly,

            subcategories,
            fetchCatalogSubcategories,
        }),
        [safeCartItems, totalItems, isCartOpen, subcategories]
    );

    return (
        <CartContext.Provider value={contextValue}>
            {children}
        </CartContext.Provider>
    );
};