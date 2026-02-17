import React from 'react';
import { View, Text, Modal, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../hooks/useTheme';
import { ThemeToggle } from './ThemeToggle';

interface HeaderMenuProps {
    visible: boolean;
    onClose: () => void;
    onLogout: () => void;
    language: string;
    onToggleLanguage: () => void;
}

export function HeaderMenu({ visible, onClose, onLogout, language, onToggleLanguage }: HeaderMenuProps) {
    const { colors } = useTheme();

    return (
        <Modal
            visible={visible}
            transparent={true}
            animationType="fade"
            onRequestClose={onClose}
        >
            <TouchableOpacity
                style={styles.overlay}
                activeOpacity={1}
                onPress={onClose}
            >
                <View style={[styles.menuContainer, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                    <View style={[styles.header, { borderBottomColor: colors.border }]}>
                        <Text style={[styles.title, { color: colors.textPrimary }]}>Configurações</Text>
                        <TouchableOpacity onPress={onClose}>
                            <Ionicons name="close" size={24} color={colors.textSecondary} />
                        </TouchableOpacity>
                    </View>

                    <View style={styles.content}>
                        {/* Theme Toggle Area */}
                        <View style={styles.menuItem}>
                            <View style={styles.itemInfo}>
                                <Ionicons name="moon-outline" size={20} color={colors.textPrimary} />
                                <Text style={[styles.itemText, { color: colors.textPrimary }]}>Tema Escuro</Text>
                            </View>
                            <ThemeToggle size={24} />
                        </View>

                        {/* Language Toggle */}
                        <TouchableOpacity style={styles.menuItem} onPress={onToggleLanguage}>
                            <View style={styles.itemInfo}>
                                <Ionicons name="language-outline" size={20} color={colors.textPrimary} />
                                <Text style={[styles.itemText, { color: colors.textPrimary }]}>Idioma</Text>
                            </View>
                            <View style={[styles.badge, { backgroundColor: colors.surfaceVariant }]}>
                                <Text style={{ fontSize: 12, fontWeight: '700', color: colors.textPrimary }}>
                                    {language.toUpperCase()}
                                </Text>
                            </View>
                        </TouchableOpacity>

                        <View style={[styles.divider, { backgroundColor: colors.border }]} />

                        {/* Logout */}
                        <TouchableOpacity style={styles.menuItem} onPress={onLogout}>
                            <View style={styles.itemInfo}>
                                <Ionicons name="log-out-outline" size={20} color={colors.error} />
                                <Text style={[styles.itemText, { color: colors.error }]}>Sair</Text>
                            </View>
                        </TouchableOpacity>
                    </View>
                </View>
            </TouchableOpacity>
        </Modal>
    );
}

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.4)',
        justifyContent: 'flex-start',
        alignItems: 'flex-end',
        paddingTop: Platform.OS === 'ios' ? 60 : 20,
        paddingRight: 20,
    },
    menuContainer: {
        width: 220,
        borderRadius: 12,
        borderWidth: 1,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 5,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 16,
        borderBottomWidth: 1,
    },
    title: {
        fontSize: 16,
        fontWeight: '700',
    },
    content: {
        paddingVertical: 8,
    },
    menuItem: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 12,
    },
    itemInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    itemText: {
        fontSize: 15,
        fontWeight: '500',
    },
    divider: {
        height: 1,
        marginVertical: 8,
        marginHorizontal: 16,
    },
    badge: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 6,
    }
});
