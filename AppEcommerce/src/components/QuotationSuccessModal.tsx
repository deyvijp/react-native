import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Share,
    Platform,
    Linking,
    Alert,
    ActivityIndicator
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useCompany } from '../context/CompanyContext';
import { ENV } from '../config/env';
import { getSession } from '../services/session';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';

type Props = {
    visible: boolean;
    orderName: string;
    orderTotal: number;
    orderDate: string;
    orderId: number;
    onClose: () => void;
    onViewQuotation: () => void;
};

export const QuotationSuccessModal = ({
    visible,
    orderName,
    orderTotal,
    orderDate,
    orderId,
    onClose,
    onViewQuotation
}: Props) => {
    const { formatPrice } = useCompany();
    const [downloadingPdf, setDownloadingPdf] = useState(false);

    const getPdfUrl = () => {
        const session = getSession();
        // Odoo PDF report endpoint
        return `${ENV.ODOO_URL}/report/pdf/sale.report_saleorder/${orderId}?session_id=${session.sessionId}`;
    };

    const handleViewPdf = async () => {
        try {
            setDownloadingPdf(true);
            const session = getSession();

            // Download PDF first to bypass login requirement in external browser
            const pdfUrl = `${ENV.ODOO_URL}/report/pdf/sale.report_saleorder/${orderId}`;
            const fileUri = FileSystem.documentDirectory + `Cotizacion_${orderName}.pdf`;

            const downloadResult = await FileSystem.downloadAsync(
                pdfUrl,
                fileUri,
                {
                    headers: {
                        'Cookie': `session_id=${session.sessionId}`
                    }
                }
            );

            if (downloadResult.status === 200) {
                // Use Sharing to view/share the file (works as a viewer on many platforms)
                if (await Sharing.isAvailableAsync()) {
                    await Sharing.shareAsync(downloadResult.uri, {
                        mimeType: 'application/pdf',
                        dialogTitle: `Ver Cotización ${orderName}`,
                        UTI: 'com.adobe.pdf'
                    });
                } else {
                    Alert.alert('PDF Descargado', `Guardado en: ${downloadResult.uri}`);
                }
            } else {
                Alert.alert('Error', 'No se pudo descargar el PDF. Verifica tu conexión.');
            }
        } catch (error) {
            console.error('Error viewing PDF:', error);
            Alert.alert('Error', 'Hubo un problema al abrir el PDF');
        } finally {
            setDownloadingPdf(false);
        }
    };

    const handleSharePdf = async () => {
        try {
            setDownloadingPdf(true);
            const session = getSession();

            // Download PDF to local file
            const pdfUrl = `${ENV.ODOO_URL}/report/pdf/sale.report_saleorder/${orderId}`;
            const fileUri = FileSystem.documentDirectory + `Cotizacion_${orderName}.pdf`;

            const downloadResult = await FileSystem.downloadAsync(
                pdfUrl,
                fileUri,
                {
                    headers: {
                        'Cookie': `session_id=${session.sessionId}`
                    }
                }
            );

            if (downloadResult.status === 200) {
                // Check if sharing is available
                const isAvailable = await Sharing.isAvailableAsync();

                if (isAvailable) {
                    await Sharing.shareAsync(downloadResult.uri, {
                        mimeType: 'application/pdf',
                        dialogTitle: `Compartir ${orderName}`,
                        UTI: 'com.adobe.pdf'
                    });
                } else {
                    Alert.alert('Éxito', 'PDF descargado correctamente');
                }
            } else {
                throw new Error('Error downloading PDF');
            }
        } catch (error) {
            console.error('Error sharing PDF:', error);
            Alert.alert('Error', 'No se pudo compartir el PDF');
        } finally {
            setDownloadingPdf(false);
        }
    };

    if (!visible) return null;

    return (
        <View style={styles.overlay}>
            <View style={styles.container}>
                {/* Header with share button */}
                <View style={styles.header}>
                    <Text style={styles.headerTitle}>Cotización Enviada</Text>
                    <TouchableOpacity
                        onPress={handleSharePdf}
                        style={styles.shareButton}
                        disabled={downloadingPdf}
                    >
                        {downloadingPdf ? (
                            <ActivityIndicator size="small" color="#fff" />
                        ) : (
                            <Ionicons name="share-outline" size={24} color="#fff" />
                        )}
                    </TouchableOpacity>
                </View>

                {/* Success checkmark */}
                <View style={styles.checkmarkContainer}>
                    <View style={styles.checkmarkCircle}>
                        <Ionicons name="checkmark" size={48} color="#fff" />
                    </View>
                </View>

                {/* Details card */}
                <View style={styles.detailsCard}>
                    <Text style={styles.detailsTitle}>Cotización de:</Text>
                    <Text style={styles.amount}>{formatPrice(orderTotal)}</Text>
                    <Text style={styles.date}>{orderDate}</Text>

                    <View style={styles.divider} />

                    <View style={styles.infoRow}>
                        <Text style={styles.infoLabel}>Número</Text>
                        <Text style={styles.infoValue}>{orderName}</Text>
                    </View>

                    <View style={styles.infoRow}>
                        <Text style={styles.infoLabel}>Estado</Text>
                        <Text style={styles.infoValue}>Enviada</Text>
                    </View>
                </View>

                {/* Action buttons */}
                <TouchableOpacity
                    style={styles.primaryButton}
                    onPress={handleViewPdf}
                    disabled={downloadingPdf}
                >
                    <Ionicons name="document-text-outline" size={20} color="#0047AB" style={{ marginRight: 8 }} />
                    <Text style={styles.primaryButtonText}>Ver PDF</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={styles.secondaryButton}
                    onPress={onViewQuotation}
                    disabled={downloadingPdf}
                >
                    <Text style={styles.secondaryButtonText}>Ver Detalles</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={styles.tertiaryButton}
                    onPress={onClose}
                    disabled={downloadingPdf}
                >
                    <Text style={styles.tertiaryButtonText}>Finalizar</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    overlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: '#0047AB',
        zIndex: 1000,
    },
    container: {
        flex: 1,
        paddingTop: Platform.OS === 'ios' ? 60 : 40,
        paddingHorizontal: 20,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 40,
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: '600',
        color: '#fff',
    },
    shareButton: {
        padding: 8,
        width: 40,
        height: 40,
        justifyContent: 'center',
        alignItems: 'center',
    },
    checkmarkContainer: {
        alignItems: 'center',
        marginBottom: 40,
    },
    checkmarkCircle: {
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        borderWidth: 3,
        borderColor: '#fff',
        justifyContent: 'center',
        alignItems: 'center',
    },
    detailsCard: {
        backgroundColor: '#fff',
        borderRadius: 20,
        padding: 25,
        marginBottom: 20,
    },
    detailsTitle: {
        fontSize: 14,
        color: '#666',
        textAlign: 'center',
        marginBottom: 10,
    },
    amount: {
        fontSize: 36,
        fontWeight: 'bold',
        color: '#0047AB',
        textAlign: 'center',
        marginBottom: 8,
    },
    date: {
        fontSize: 14,
        color: '#666',
        textAlign: 'center',
        marginBottom: 20,
    },
    divider: {
        height: 1,
        backgroundColor: '#e5e7eb',
        marginVertical: 20,
    },
    infoRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 15,
    },
    infoLabel: {
        fontSize: 14,
        color: '#666',
    },
    infoValue: {
        fontSize: 14,
        fontWeight: '600',
        color: '#333',
    },
    primaryButton: {
        backgroundColor: '#fff',
        paddingVertical: 16,
        borderRadius: 30,
        alignItems: 'center',
        marginBottom: 12,
        flexDirection: 'row',
        justifyContent: 'center',
    },
    primaryButtonText: {
        color: '#0047AB',
        fontSize: 16,
        fontWeight: 'bold',
    },
    secondaryButton: {
        backgroundColor: 'transparent',
        paddingVertical: 16,
        borderRadius: 30,
        alignItems: 'center',
        borderWidth: 2,
        borderColor: '#fff',
        marginBottom: 12,
    },
    secondaryButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
    tertiaryButton: {
        backgroundColor: 'transparent',
        paddingVertical: 16,
        borderRadius: 30,
        alignItems: 'center',
    },
    tertiaryButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
        opacity: 0.8,
    },
});
