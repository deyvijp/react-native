export type RootStackParamList = {
    Login: undefined;
    Home: { username: string };
    Profile: { username: string };
    ProductDetail: { productId: number };
    Cart: undefined;
    PersonalData: { username: string };
    Scanner: { mode: 'cart' | 'price_check' };
    Orders: undefined;
    OrderDetail: { orderId: number };
    Quotations: undefined;
};
