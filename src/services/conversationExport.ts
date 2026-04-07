import { Alert, Platform, Share, ToastAndroid } from 'react-native';
import { Conversation, exportConversation } from './conversationStore';
import { exportConversationAsPdf } from './pdfExport';

async function shareTextExport(
  conversationId: string,
  title: string,
  format: 'json' | 'markdown' | 'text'
) {
  const content = exportConversation(conversationId, format);
  if (!content.trim()) {
    throw new Error('There is nothing to export for this conversation yet.');
  }
  await Share.share({ message: content, title });
}

async function sharePdfExport(conversation: Conversation) {
  const filePath = await exportConversationAsPdf(conversation);
  try {
    await Share.share({
      url: `file://${filePath}`,
      title: conversation.title,
      message: conversation.title,
    });
  } catch (shareError) {
    if (Platform.OS === 'android') {
      Alert.alert('PDF Saved', `Saved to:\n${filePath}`);
      return;
    }
    throw shareError;
  }
}

function showMoreFormats(conversation: Conversation) {
  Alert.alert('More export formats', 'Choose format:', [
    {
      text: 'Plain Text',
      onPress: async () => {
        try {
          await shareTextExport(conversation.id, conversation.title, 'text');
        } catch (e: any) {
          Alert.alert('Export Error', e?.message ?? 'Failed to export text');
        }
      },
    },
    {
      text: 'PDF',
      onPress: async () => {
        try {
          if (Platform.OS === 'android') {
            ToastAndroid.show('Generating PDF...', ToastAndroid.SHORT);
          }
          await sharePdfExport(conversation);
        } catch (e: any) {
          Alert.alert('Export Error', e?.message ?? 'Failed to generate PDF');
        }
      },
    },
    { text: 'Cancel', style: 'cancel' },
  ]);
}

export function showConversationExportMenu(conversation: Conversation) {
  const buttons = [
    {
      text: 'JSON',
      onPress: async () => {
        try {
          await shareTextExport(conversation.id, conversation.title, 'json');
        } catch (e: any) {
          Alert.alert('Export Error', e?.message ?? 'Failed to export JSON');
        }
      },
    },
    {
      text: 'Markdown',
      onPress: async () => {
        try {
          await shareTextExport(conversation.id, conversation.title, 'markdown');
        } catch (e: any) {
          Alert.alert('Export Error', e?.message ?? 'Failed to export Markdown');
        }
      },
    },
    {
      text: 'More',
      onPress: () => {
        showMoreFormats(conversation);
      },
    },
  ] as const;

  Alert.alert(
    'Export Conversation',
    'Choose format:',
    Platform.OS === 'android'
      ? [...buttons]
      : [...buttons, { text: 'Cancel', style: 'cancel' as const }]
  );
}
