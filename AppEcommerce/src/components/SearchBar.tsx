import React, { useState, useRef } from 'react';
import {
    View,
    TextInput,
    StyleSheet,
    TouchableOpacity,
    FlatList,
    Text,
    Image,
    Keyboard,
    ActivityIndicator
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ENV } from '../config/env';
import { getSession } from '../services/session';
import { useNavigation } from '@react-navigation/native';
import { useCompany } from '../context/CompanyContext';

type SearchResult = {
    id: number;
    name: string;
    price: number;
    image_url: string;
    description?: string;
};

export const SearchBar = () => {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<SearchResult[]>([]);
    const [loading, setLoading] = useState(false);
    const [showResults, setShowResults] = useState(false);
    const searchTimeout = useRef<NodeJS.Timeout | null>(null);
    const navigation = useNavigation<any>();
    const { formatPrice } = useCompany();

    const handleSearch = async (text: string) => {
        setQuery(text);

        if (searchTimeout.current) {
            clearTimeout(searchTimeout.current);
        }

        if (text.length < 2) {
            setResults([]);
            setShowResults(false);
            return;
        }

        searchTimeout.current = setTimeout(async () => {
            setLoading(true);
            try {
                const session = getSession();
                const headers: any = {
                    'Content-Type': 'application/json',
                };

                if (session.sessionId) {
                    headers['Cookie'] = `session_id=${session.sessionId}`;
                }

                const payload = {
                    jsonrpc: '2.0',
                    method: 'call',
                    params: {
                        term: text,
                        options: {
                            displayDescription: true,
                            displayDetail: true,
                            displayImage: true,
                            max_nb_chars: 100,
                        },
                    },
                    id: Math.floor(Math.random() * 1000000000),
                };

                const response = await fetch(`${ENV.ODOO_URL}/website/snippet/autocomplete`, {
                    method: 'POST',
                    headers: headers,
                    body: JSON.stringify(payload),
                });

                if (response.ok) {
                    const text = await response.text();
                    try {
                        const json = JSON.parse(text);
                        const products = json.result?.products || [];

                        const formattedResults: SearchResult[] = products.map((p: any) => ({
                            id: p.id,
                            name: p.name,
                            price: p.list_price || 0,
                            image_url: `${ENV.ODOO_URL}/web/image/product.template/${p.id}/image_128`,
                            description: p.description_sale,
                        }));

                        setResults(formattedResults);
                        setShowResults(true);
                    } catch (e) {
                        console.error('Parse error:', e);
                    }
                }
            } catch (error) {
                console.error('Search error:', error);
            } finally {
                setLoading(false);
            }
        }, 300); // Debounce 300ms
    };

    const handleSelectProduct = (productId: number) => {
        setShowResults(false);
        setQuery('');
        Keyboard.dismiss();
        navigation.navigate('ProductDetail', { productId });
    };

    const renderResult = ({ item }: { item: SearchResult }) => (
        <TouchableOpacity
            style={styles.resultItem}
            onPress={() => handleSelectProduct(item.id)}
        >
            <Image source={{ uri: item.image_url }} style={styles.resultImage} />
            <View style={styles.resultInfo}>
                <Text style={styles.resultName} numberOfLines={2}>{item.name}</Text>
                <Text style={styles.resultPrice}>{formatPrice(item.price)}</Text>
            </View>
        </TouchableOpacity>
    );

    return (
        <View style={styles.container}>
            <View style={styles.searchBox}>
                <Ionicons name="search-outline" size={20} color="#9ca3af" />
                <TextInput
                    placeholder="Buscar productos..."
                    placeholderTextColor="#9ca3af"
                    style={styles.searchInput}
                    value={query}
                    onChangeText={handleSearch}
                    onFocus={() => query.length >= 2 && setShowResults(true)}
                />
                {loading && <ActivityIndicator size="small" color="#0047AB" />}
                {query.length > 0 && !loading && (
                    <TouchableOpacity onPress={() => { setQuery(''); setResults([]); setShowResults(false); }}>
                        <Ionicons name="close-circle" size={20} color="#9ca3af" />
                    </TouchableOpacity>
                )}
                <TouchableOpacity onPress={() => navigation.navigate('Scanner', { mode: 'cart' })} style={styles.scanButton}>
                    <Ionicons name="barcode-outline" size={24} color="#555" />
                </TouchableOpacity>
            </View>

            {showResults && results.length > 0 && (
                <View style={styles.resultsContainer}>
                    <FlatList
                        data={results}
                        renderItem={renderResult}
                        keyExtractor={(item) => item.id.toString()}
                        style={styles.resultsList}
                        keyboardShouldPersistTaps="handled"
                    />
                </View>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        paddingHorizontal: 20,
        paddingBottom: 10,
        position: 'relative',
        zIndex: 1000,
    },
    searchBox: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#f5f7fa',
        borderRadius: 12,
        paddingHorizontal: 15,
        paddingVertical: 10,
        borderWidth: 1,
        borderColor: '#e5e7eb',
    },
    searchInput: {
        flex: 1,
        marginLeft: 10,
        fontSize: 16,
        color: '#333',
    },
    scanButton: {
        marginLeft: 10,
    },
    resultsContainer: {
        position: 'absolute',
        top: 60,
        left: 20,
        right: 20,
        backgroundColor: '#fff',
        borderRadius: 12,
        maxHeight: 400,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 5,
        zIndex: 1001,
    },
    resultsList: {
        maxHeight: 400,
    },
    resultItem: {
        flexDirection: 'row',
        padding: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
    },
    resultImage: {
        width: 60,
        height: 60,
        borderRadius: 8,
        backgroundColor: '#f5f5f5',
    },
    resultInfo: {
        flex: 1,
        marginLeft: 12,
        justifyContent: 'center',
    },
    resultName: {
        fontSize: 14,
        fontWeight: '600',
        color: '#333',
        marginBottom: 4,
    },
    resultPrice: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#0047AB',
    },
});
