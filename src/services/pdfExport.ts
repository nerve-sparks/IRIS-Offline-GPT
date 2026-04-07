import { Platform } from 'react-native';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import RNFS from 'react-native-fs';
import ReactNativeBlobUtil from 'react-native-blob-util';
import { Conversation } from './conversationStore';

const PAGE_WIDTH = 595;
const PAGE_HEIGHT = 842;
const MARGIN = 50;
const LINE_HEIGHT = 16;
const FONT_SIZE_TITLE = 18;
const FONT_SIZE_SENDER = 11;
const FONT_SIZE_BODY = 11;
const FONT_SIZE_TS = 9;

function sanitizePdfText(text: string): string {
  return text
    .replace(/\r\n/g, '\n')
    .replace(/\u202f/g, ' ')
    .replace(/\u00a0/g, ' ')
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[\u201c\u201d]/g, '"')
    .replace(/[\u2013\u2014]/g, '-')
    .replace(/\u2026/g, '...')
    .replace(/[^\x09\x0a\x0d\x20-\x7e]/g, '?');
}

function wrapText(text: string, font: any, fontSize: number, maxWidth: number): string[] {
  const words = text.replace(/\r?\n/g, ' \n ').split(' ');
  const lines: string[] = [];
  let current = '';

  for (const word of words) {
    if (word === '\n') {
      lines.push(current.trim());
      current = '';
      continue;
    }

    const test = current ? `${current} ${word}` : word;
    try {
      const width = font.widthOfTextAtSize(test, fontSize);
      if (width > maxWidth && current) {
        lines.push(current.trim());
        current = word;
      } else {
        current = test;
      }
    } catch {
      current = test;
    }
  }

  if (current.trim()) {
    lines.push(current.trim());
  }

  return lines;
}

export async function exportConversationAsPdf(conv: Conversation): Promise<string> {
  const pdfDoc = await PDFDocument.create();
  const regularFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  const safeTitle = sanitizePdfText(conv.title);
  const usableWidth = PAGE_WIDTH - MARGIN * 2;
  let page = pdfDoc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
  let y = PAGE_HEIGHT - MARGIN;

  const ensureSpace = (needed: number) => {
    if (y - needed < MARGIN) {
      page = pdfDoc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
      y = PAGE_HEIGHT - MARGIN;
    }
  };

  ensureSpace(FONT_SIZE_TITLE + LINE_HEIGHT * 2);
  page.drawText(safeTitle, {
    x: MARGIN,
    y,
    size: FONT_SIZE_TITLE,
    font: boldFont,
    color: rgb(0.04, 0.04, 0.1),
  });
  y -= FONT_SIZE_TITLE + 4;

  const createdAt = sanitizePdfText(`Created: ${new Date(conv.createdAt).toLocaleString()}`);
  page.drawText(createdAt, {
    x: MARGIN,
    y,
    size: FONT_SIZE_TS,
    font: regularFont,
    color: rgb(0.55, 0.55, 0.55),
  });
  y -= LINE_HEIGHT;

  ensureSpace(LINE_HEIGHT);
  page.drawLine({
    start: { x: MARGIN, y },
    end: { x: PAGE_WIDTH - MARGIN, y },
    thickness: 0.5,
    color: rgb(0.8, 0.8, 0.8),
  });
  y -= LINE_HEIGHT;

  for (const msg of conv.messages) {
    const isUser = msg.sender === 'user';
    const senderLabel = isUser ? 'You' : 'IRIS';
    const senderColor = isUser ? rgb(0.09, 0.39, 0.92) : rgb(0.2, 0.65, 0.35);
    const ts = new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const badges = [msg.isPinned ? '[Pinned]' : '', msg.isStarred ? '[Starred]' : ''].filter(Boolean).join('  ');
    const senderRow = sanitizePdfText(`${senderLabel}  ${ts}${badges ? `   ${badges}` : ''}`);

    ensureSpace(LINE_HEIGHT * 2);
    page.drawText(senderRow, {
      x: MARGIN,
      y,
      size: FONT_SIZE_SENDER,
      font: boldFont,
      color: senderColor,
    });
    y -= LINE_HEIGHT;

    const bodyLines = wrapText(sanitizePdfText(msg.text), regularFont, FONT_SIZE_BODY, usableWidth);
    for (const line of bodyLines) {
      ensureSpace(LINE_HEIGHT);
      page.drawText(line, {
        x: MARGIN + 8,
        y,
        size: FONT_SIZE_BODY,
        font: regularFont,
        color: rgb(0.1, 0.1, 0.1),
      });
      y -= LINE_HEIGHT;
    }

    y -= 6;
  }

  const base64 = await pdfDoc.saveAsBase64();
  const safeFileTitle = conv.title.replace(/[^a-z0-9]/gi, '_').slice(0, 40) || 'conversation';
  const fileName = `iris_${safeFileTitle}_${Date.now()}.pdf`;
  const tempDir = RNFS.CachesDirectoryPath || RNFS.DocumentDirectoryPath;
  const tempPath = `${tempDir}/${fileName}`;

  await RNFS.writeFile(tempPath, base64, 'base64');

  if (Platform.OS === 'android') {
    return ReactNativeBlobUtil.MediaCollection.copyToMediaStore(
      {
        name: fileName,
        parentFolder: 'IRIS',
        mimeType: 'application/pdf',
      },
      'Download',
      tempPath
    );
  }

  return tempPath;
}
