// Server messages are authored in Hindi; this maps them to English when the client asks for `lang=en`.

export const langOf = (req) => (req.query?.lang === 'en' ? 'en' : 'hi');

const EN = {
  // generic
  'कृपया लॉगिन करें': 'Please log in',
  'आपको इसकी अनुमति नहीं है': 'You do not have permission to do this',
  'यह पेज नहीं मिला': 'Page not found',
  'अमान्य अनुरोध': 'Invalid request',
  'अमान्य JSON': 'Invalid JSON',
  'यह प्रविष्टि पहले से मौजूद है': 'This entry already exists',
  'सर्वर में कुछ गड़बड़ हुई': 'Something went wrong on the server',
  'बहुत ज़्यादा प्रयास, कुछ देर बाद फिर कोशिश करें': 'Too many attempts, please try again later',
  // auth
  'नाम, ईमेल और पासवर्ड ज़रूरी हैं': 'Name, email and password are required',
  'ईमेल और पासवर्ड ज़रूरी हैं': 'Email and password are required',
  'इस ईमेल से खाता पहले से मौजूद है': 'An account with this email already exists',
  'ईमेल या पासवर्ड गलत है': 'Incorrect email or password',
  // articles / comments
  'खबर नहीं मिली': 'Article not found',
  'अमान्य स्थिति': 'Invalid status',
  'चुनी गई श्रेणी मौजूद नहीं है': 'The selected category does not exist',
  'टिप्पणी नहीं मिली': 'Comment not found',
  'आप यह टिप्पणी नहीं हटा सकते': 'You cannot delete this comment',
  // model validation
  'नाम ज़रूरी है': 'Name is required',
  'नाम 60 अक्षरों से छोटा होना चाहिए': 'Name must be under 60 characters',
  'ईमेल ज़रूरी है': 'Email is required',
  'सही ईमेल दर्ज करें': 'Enter a valid email',
  'पासवर्ड ज़रूरी है': 'Password is required',
  'पासवर्ड कम से कम 8 अक्षर का होना चाहिए': 'Password must be at least 8 characters',
  'शीर्षक ज़रूरी है': 'Title is required',
  'शीर्षक 200 अक्षरों से छोटा होना चाहिए': 'Title must be under 200 characters',
  'सार ज़रूरी है': 'Summary is required',
  'सार 400 अक्षरों से छोटा होना चाहिए': 'Summary must be under 400 characters',
  'खबर का मुख्य हिस्सा ज़रूरी है': 'Article body is required',
  'खबर बहुत लंबी है': 'Article is too long',
  'इमेज लिंक http:// या https:// से शुरू होना चाहिए': 'Image link must start with http:// or https://',
  'इमेज का विवरण 200 अक्षरों से छोटा होना चाहिए': 'Image description must be under 200 characters',
  'लेखक का नाम 80 अक्षरों से छोटा होना चाहिए': 'Author name must be under 80 characters',
  'टैग 30 अक्षरों से छोटा होना चाहिए': 'A tag must be under 30 characters',
  'श्रेणी चुनें': 'Choose a category',
  'अधिकतम 10 टैग जोड़ सकते हैं': 'You can add at most 10 tags',
  'अंग्रेज़ी अनुवाद के लिए शीर्षक, सार और खबर तीनों ज़रूरी हैं':
    'An English version needs a title, summary and body together',
  'टिप्पणी खाली नहीं हो सकती': 'Comment cannot be empty',
  'टिप्पणी 1000 अक्षरों से छोटी होनी चाहिए': 'Comment must be under 1000 characters',
};

export const translateMessage = (message, lang) => (lang === 'en' ? (EN[message] ?? message) : message);
