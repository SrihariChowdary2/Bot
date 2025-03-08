// Service for handling file attachments in chat
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];

// Function to validate file before upload
const validateFile = (file) => {
  if (!file) {
    throw new Error('No file provided');
  }

  if (!ALLOWED_TYPES.includes(file.type)) {
    throw new Error('Invalid file type. Only images (JPEG, PNG, GIF, WEBP) are allowed');
  }

  if (file.size > MAX_FILE_SIZE) {
    throw new Error('File size exceeds 5MB limit');
  }

  return true;
};

// Function to convert file to base64
const fileToBase64 = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result);
    reader.onerror = (error) => reject(error);
  });
};

// Function to handle file upload
export const uploadAttachment = async (file) => {
  try {
    validateFile(file);
    const base64Data = await fileToBase64(file);
    
    // Store the attachment data (you might want to implement actual storage later)
    const attachment = {
      id: Date.now().toString(),
      name: file.name,
      type: file.type,
      size: file.size,
      url: base64Data,
      uploadedAt: new Date().toISOString()
    };

    return {
      success: true,
      attachment
    };
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
};

// Function to get file preview URL
export const getAttachmentPreview = (attachment) => {
  if (!attachment || !attachment.url) {
    return null;
  }
  return attachment.url;
};