import { Alert, Platform, Share, ToastAndroid } from 'react-native';
import { Conversation, exportConversation } from './conversationStore';
import { exportConversationAsPdf } from './pdfExport';

async function shareTextExport(
  conversationId: string,
  title: string,
  format: 'json' | 'markdown' | 'text'
) {
  const content = exportConversation(conversationId, format);
  await Share.share({ message: content, title });
}

async function sharePdfExport(conversation: Conversation) {
  const filePath = await exportConversationAsPdf(conversation);
  if (Platform.OS === 'android') {
    Alert.alert('PDF Saved', `Saved to:\n${filePath}`);
    return;
  }
  await Share.share({
    url: `file://${filePath}`,
    title: conversation.title,
    message: conversation.title,
  });
}

function showMoreFormats(conversation: Conversation) {
  Alert.alert('More export formats', 'Choose format:', [
    {
      text: 'Plain Text',
      onPress: async () => {
        await shareTextExport(conversation.id, conversation.title, 'text');
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
  Alert.alert('Export Conversation', 'Choose format:', [
    {
      text: 'JSON',
      onPress: async () => {
        await shareTextExport(conversation.id, conversation.title, 'json');
      },
    },
    {
      text: 'Markdown',
      onPress: async () => {
        await shareTextExport(conversation.id, conversation.title, 'markdown');
      },
    },
    {
      text: 'More',
      onPress: () => {
        showMoreFormats(conversation);
      },
    },
  ]);
}
