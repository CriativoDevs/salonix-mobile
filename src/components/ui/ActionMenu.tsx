import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useTheme } from '../../hooks/useTheme';
import { Modal } from './Modal';
import { Button } from './Button';

export interface ActionMenuOption {
  label: string;
  onPress: () => void;
  destructive?: boolean;
  testID?: string;
}

interface ActionMenuProps {
  visible: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  options: ActionMenuOption[];
  cancelLabel?: string;
  testID?: string;
}

/**
 * Menu de opções themed, substitui `ActionSheetIOS.showActionSheetWithOptions`
 * e o padrão `Alert.alert(title, message, buttons)` usado como menu (ex.:
 * "Importar/Exportar", "Foto do cliente"). Ambos renderizam como diálogos
 * nativos do sistema (sempre claros, fora do tema da app).
 *
 * Não usar para confirmações destrutivas simples ("Tem certeza que quer
 * excluir?") — essas continuam a usar `Alert.alert` nativo, que é o padrão
 * consciente já adotado no resto da app para esse tipo de confirmação.
 */
export const ActionMenu: React.FC<ActionMenuProps> = ({
  visible,
  onClose,
  title,
  description,
  options,
  cancelLabel = 'Cancelar',
  testID,
}) => {
  const { colors } = useTheme();

  const handleSelect = (option: ActionMenuOption) => {
    onClose();
    option.onPress();
  };

  return (
    <Modal
      visible={visible}
      onClose={onClose}
      title={title}
      description={description}
      size="sm"
      footer={
        <Button variant="link" onPress={onClose} style={{ flex: 1 }}>
          {cancelLabel}
        </Button>
      }
    >
      <View testID={testID}>
        {options.map((option, index) => (
          <TouchableOpacity
            key={option.label}
            testID={option.testID}
            onPress={() => handleSelect(option)}
            style={[
              styles.option,
              index > 0 && { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.border },
            ]}
          >
            <Text style={{ color: option.destructive ? colors.error : colors.textPrimary, fontSize: 16 }}>
              {option.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  option: {
    paddingVertical: 14,
  },
});
