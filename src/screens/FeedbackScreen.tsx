import React, { useMemo, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../hooks/useTheme';
import { useTenant } from '../hooks/useTenant';
import { useLanguage } from '../contexts/LanguageContext';
import { useToast } from '../contexts/ToastContext';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Card } from '../components/ui/Card';
import { Alert } from '../components/ui/Alert';
import { submitFeedback } from '../api/feedback';
import { parseApiError } from '../utils/apiError';

const MESSAGE_MAX = 2000;

const CATEGORIES = ['app', 'support', 'pwa', 'praise', 'other'] as const;

const COPY = {
  pt: {
    title: 'Feedback',
    subtitle: 'A sua opinião ajuda a melhorar a plataforma. Conte-nos o que está a correr bem e o que pode melhorar.',
    ratingLabel: 'Avaliação',
    categoryLabel: 'Categoria',
    customCategoryLabel: 'Especifique o tipo de feedback',
    customCategoryPlaceholder: 'Ex.: Sugestão de funcionalidade',
    messageLabel: 'Mensagem',
    messagePlaceholder: 'Escreva a sua mensagem...',
    anonymousLabel: 'Enviar como anónimo',
    submit: 'Enviar feedback',
    submitAnother: 'Enviar outro feedback',
    errorRatingRequired: 'Selecione uma avaliação de 1 a 5.',
    errorCategoryRequired: 'Selecione uma categoria.',
    errorCustomCategoryRequired: 'Especifique a categoria.',
    errorMessageRequired: 'Escreva uma mensagem.',
    errorMessageTooLong: 'Mensagem muito longa. Máximo de 2000 caracteres.',
    errorSubmitFailed: 'Não foi possível enviar o feedback.',
    thankYouTitle: 'Obrigado pelo feedback!',
    thankYouMessage: 'A sua mensagem foi recebida com sucesso.',
    categories: {
      app: 'Aplicação',
      support: 'Suporte',
      pwa: 'Instalação/PWA',
      praise: 'Elogio',
      other: 'Outro',
    },
  },
  en: {
    title: 'Feedback',
    subtitle: 'Your opinion helps improve the platform. Tell us what is going well and what could be better.',
    ratingLabel: 'Rating',
    categoryLabel: 'Category',
    customCategoryLabel: 'Specify the type of feedback',
    customCategoryPlaceholder: 'e.g.: Feature suggestion',
    messageLabel: 'Message',
    messagePlaceholder: 'Write your message...',
    anonymousLabel: 'Send anonymously',
    submit: 'Send feedback',
    submitAnother: 'Send another feedback',
    errorRatingRequired: 'Select a rating from 1 to 5.',
    errorCategoryRequired: 'Select a category.',
    errorCustomCategoryRequired: 'Specify the category.',
    errorMessageRequired: 'Write a message.',
    errorMessageTooLong: 'Message too long. Maximum 2000 characters.',
    errorSubmitFailed: 'Could not send the feedback.',
    thankYouTitle: 'Thank you for your feedback!',
    thankYouMessage: 'Your message was received successfully.',
    categories: {
      app: 'App',
      support: 'Support',
      pwa: 'Install/PWA',
      praise: 'Praise',
      other: 'Other',
    },
  },
};

export default function FeedbackScreen() {
  const navigation = useNavigation();
  const { colors } = useTheme();
  const { slug } = useTenant();
  const { language } = useLanguage();
  const { showToast } = useToast();

  const t = language === 'en' ? COPY.en : COPY.pt;

  const [rating, setRating] = useState(0);
  const [category, setCategory] = useState<string>('');
  const [customCategory, setCustomCategory] = useState('');
  const [message, setMessage] = useState('');
  const [anonymous, setAnonymous] = useState(false);
  const [errors, setErrors] = useState<{ rating?: string; category?: string; customCategory?: string; message?: string }>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  const messageLength = useMemo(() => message.length, [message]);

  const validate = () => {
    const nextErrors: typeof errors = {};
    if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
      nextErrors.rating = t.errorRatingRequired;
    }
    if (!category) {
      nextErrors.category = t.errorCategoryRequired;
    }
    if (category === 'other' && !customCategory.trim()) {
      nextErrors.customCategory = t.errorCustomCategoryRequired;
    }
    const trimmedMessage = message.trim();
    if (!trimmedMessage) {
      nextErrors.message = t.errorMessageRequired;
    } else if (trimmedMessage.length > MESSAGE_MAX) {
      nextErrors.message = t.errorMessageTooLong;
    }
    return nextErrors;
  };

  const handleSubmit = async () => {
    const nextErrors = validate();
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) {
      return;
    }

    setSubmitting(true);
    setSubmitError(null);
    try {
      await submitFeedback(
        {
          category,
          custom_category: category === 'other' ? customCategory.trim() : undefined,
          rating,
          message: message.trim(),
          anonymous,
        },
        { slug }
      );
      setSubmitted(true);
    } catch (error) {
      const parsed = parseApiError(error, t.errorSubmitFailed);
      setSubmitError(parsed);
      showToast({ type: 'error', message: parsed });
    } finally {
      setSubmitting(false);
    }
  };

  const handleReset = () => {
    setRating(0);
    setCategory('');
    setCustomCategory('');
    setMessage('');
    setAnonymous(false);
    setErrors({});
    setSubmitError(null);
    setSubmitted(false);
  };

  if (submitted) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={22} color={colors.textPrimary} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>{t.title}</Text>
          <View style={{ width: 38 }} />
        </View>
        <View style={styles.thankYouContainer}>
          <Ionicons name="checkmark-circle" size={56} color={colors.success} />
          <Text style={[styles.thankYouTitle, { color: colors.textPrimary }]}>{t.thankYouTitle}</Text>
          <Text style={[styles.thankYouMessage, { color: colors.textSecondary }]}>{t.thankYouMessage}</Text>
          <Button variant="link" onPress={handleReset} style={{ marginTop: 16 }}>
            {t.submitAnother}
          </Button>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>{t.title}</Text>
        <View style={{ width: 38 }} />
      </View>

      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40 }} keyboardShouldPersistTaps="handled">
        <Text style={{ color: colors.textSecondary, fontSize: 13, marginBottom: 16 }}>{t.subtitle}</Text>

        <Card>
          <Text style={[styles.fieldLabel, { color: colors.textPrimary }]}>{t.ratingLabel}</Text>
          <View style={styles.ratingRow} accessibilityRole="radiogroup">
            {[1, 2, 3, 4, 5].map((star) => (
              <TouchableOpacity
                key={star}
                testID={`feedback-rating-${star}`}
                accessibilityLabel={`${star}`}
                onPress={() => setRating(star)}
                style={[
                  styles.ratingStar,
                  {
                    backgroundColor: star <= rating ? colors.brandPrimary : colors.surfaceVariant,
                  },
                ]}
              >
                <Ionicons name="star" size={18} color={star <= rating ? '#fff' : colors.textSecondary} />
              </TouchableOpacity>
            ))}
          </View>
          {errors.rating ? <Text style={[styles.errorText, { color: colors.error }]}>{errors.rating}</Text> : null}

          <Text style={[styles.fieldLabel, { color: colors.textPrimary, marginTop: 16 }]}>{t.categoryLabel}</Text>
          <View style={styles.categoryWrap}>
            {CATEGORIES.map((cat) => (
              <TouchableOpacity
                key={cat}
                testID={`feedback-category-${cat}`}
                onPress={() => setCategory(cat)}
                style={[
                  styles.categoryChip,
                  {
                    borderColor: category === cat ? colors.brandPrimary : colors.border,
                    backgroundColor: category === cat ? colors.brandPrimary : colors.surface,
                  },
                ]}
              >
                <Text style={{ color: category === cat ? '#fff' : colors.textPrimary, fontSize: 13, fontWeight: '600' }}>
                  {t.categories[cat]}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          {errors.category ? <Text style={[styles.errorText, { color: colors.error }]}>{errors.category}</Text> : null}

          {category === 'other' && (
            <View style={{ marginTop: 12 }}>
              <Input
                testID="feedback-custom-category-input"
                label={t.customCategoryLabel}
                placeholder={t.customCategoryPlaceholder}
                value={customCategory}
                onChangeText={setCustomCategory}
                maxLength={100}
                error={errors.customCategory}
                editable={!submitting}
              />
            </View>
          )}

          <View style={{ marginTop: 4 }}>
            <Input
              testID="feedback-message-input"
              label={t.messageLabel}
              placeholder={t.messagePlaceholder}
              value={message}
              onChangeText={setMessage}
              maxLength={MESSAGE_MAX}
              multiline
              numberOfLines={6}
              style={{ minHeight: 120, textAlignVertical: 'top' }}
              error={errors.message}
              editable={!submitting}
            />
            <Text style={{ color: colors.textTertiary, fontSize: 11, marginTop: -12, marginBottom: 12 }}>
              {messageLength}/{MESSAGE_MAX}
            </Text>
          </View>

          <TouchableOpacity
            testID="feedback-anonymous-toggle"
            style={styles.anonymousRow}
            onPress={() => setAnonymous((prev) => !prev)}
            disabled={submitting}
          >
            <Ionicons
              name={anonymous ? 'checkbox' : 'square-outline'}
              size={20}
              color={anonymous ? colors.brandPrimary : colors.textSecondary}
            />
            <Text style={{ color: colors.textPrimary, fontSize: 14 }}>{t.anonymousLabel}</Text>
          </TouchableOpacity>

          {submitError ? (
            <View style={{ marginTop: 12 }}>
              <Alert type="error" message={submitError} />
            </View>
          ) : null}

          <Button
            variant="link"
            onPress={handleSubmit}
            disabled={submitting}
            loading={submitting}
            style={{ marginTop: 12, alignSelf: 'flex-start' }}
          >
            {t.submit}
          </Button>
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backBtn: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '600',
  },
  fieldLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  ratingRow: {
    flexDirection: 'row',
    gap: 8,
  },
  ratingStar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  categoryWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  categoryChip: {
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  errorText: {
    fontSize: 12,
    marginTop: 6,
  },
  anonymousRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 4,
  },
  thankYouContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  thankYouTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginTop: 16,
    textAlign: 'center',
  },
  thankYouMessage: {
    fontSize: 14,
    marginTop: 8,
    textAlign: 'center',
  },
});
