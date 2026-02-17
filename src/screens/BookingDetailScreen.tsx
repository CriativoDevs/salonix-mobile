import React from 'react';
import { View, Text, SafeAreaView, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../hooks/useTheme';

const BookingDetailScreen = ({ navigation, route }: any) => {
  const { colors } = useTheme();
  const { id } = route?.params || {};

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12 }}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={{ marginRight: 12 }}>
          <Ionicons name="chevron-back" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={{ fontSize: 18, fontWeight: 'bold', color: colors.textPrimary }}>
          Detalhes do Agendamento
        </Text>
      </View>

      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Text style={{ color: colors.textSecondary, fontSize: 14 }}>
          Detalhe da reserva {id}
        </Text>
        <Text style={{ color: colors.textSecondary, fontSize: 12, marginTop: 8 }}>
          (Implementação em progresso)
        </Text>
      </View>
    </SafeAreaView>
  );
};

export default BookingDetailScreen;
