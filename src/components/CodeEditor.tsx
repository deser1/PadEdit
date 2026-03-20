import React, { useRef, useEffect, useState } from 'react';
import { View, StyleSheet, ActivityIndicator, Platform } from 'react-native';
import { WebView } from 'react-native-webview';

interface CodeEditorProps {
  initialCode: string;
  language: string;
  onChange: (code: string) => void;
  theme?: 'vs-dark' | 'vs-light';
}

export interface CodeEditorHandle {
  insertText: (text: string) => void;
  focus: () => void;
  getSelectedText: () => Promise<string>;
}

const CodeEditor = React.forwardRef<CodeEditorHandle, CodeEditorProps>(({ initialCode, language, onChange, theme = 'vs-dark' }, ref) => {
  const webViewRef = useRef<WebView>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  const htmlContent = React.useMemo(() => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
  <style>
    html, body, #container { width: 100%; height: 100%; margin: 0; padding: 0; overflow: hidden; }
  </style>
  <script src="https://unpkg.com/monaco-editor@0.45.0/min/vs/loader.js"></script>
</head>
<body>
  <div id="container"></div>
  <script>
    require.config({ paths: { 'vs': 'https://unpkg.com/monaco-editor@0.45.0/min/vs' }});
    require(['vs/editor/editor.main'], function() {
      window.editor = monaco.editor.create(document.getElementById('container'), {
        value: ${JSON.stringify(initialCode)},
        language: '${language}',
        theme: '${theme}',
        automaticLayout: true,
        minimap: { enabled: false },
        wordWrap: 'on',
        readOnly: false,
        domReadOnly: false,
        scrollbar: {
          useShadows: false,
          verticalHasArrows: false,
          horizontalHasArrows: false,
          vertical: 'visible',
          horizontal: 'hidden',
        },
        fontFamily: 'monospace',
        fontSize: 14,
        lineHeight: 20,
        // Disable accessibilitySupport as it creates a hidden textarea that 
        // completely breaks mobile composition (Gboard).
        accessibilitySupport: 'off',
        // Disable features that fight with mobile keyboards
        suggestOnTriggerCharacters: false,
        acceptSuggestionOnEnter: 'off',
        quickSuggestions: false,
        lightbulb: { enabled: false }
      });

      const container = document.getElementById('container');
      
      const style = document.createElement('style');
      style.innerHTML = \`
        /* Reset all hacks */
        .monaco-editor .inputarea {
            background: transparent !important;
            color: transparent !important;
        }
      \`;
      document.head.appendChild(style);

      // The core issue on Android is that the virtual keyboard (IME) 
      // sends composition events instead of raw key strokes.
      // Monaco's internal input handler gets confused and places the cursor incorrectly.
      // We must disable native autocorrect/composition at the DOM level.
      const fixMobileKeyboard = () => {
        const textareas = document.querySelectorAll('textarea');
        textareas.forEach(textarea => {
           // These attributes are CRITICAL to stop Gboard from buffering input
           textarea.setAttribute('autocomplete', 'off');
           textarea.setAttribute('autocorrect', 'off');
           textarea.setAttribute('autocapitalize', 'off');
           textarea.setAttribute('spellcheck', 'false');
           // inputmode="none" or "email" sometimes bypasses composition better than "text"
           textarea.setAttribute('inputmode', 'email'); 
           textarea.setAttribute('data-gramm', 'false');
           textarea.removeAttribute('readonly');
           
           // Remove the previous event listeners that caused cursor jumping
           const newTextarea = textarea.cloneNode(true);
           textarea.parentNode.replaceChild(newTextarea, textarea);
        });
      };

      window.editor.onDidLayoutChange(fixMobileKeyboard);
      setTimeout(fixMobileKeyboard, 500);

      container.addEventListener('touchend', function(e) {
         const textarea = container.querySelector('textarea');
         if (textarea) {
             textarea.focus();
             textarea.click();
         }
      }, false);
      
      // Auto-focus on load
      setTimeout(() => {
        window.editor.focus();
      }, 500);

      // Debounce model changes
      let timeoutId;
      window.editor.onDidChangeModelContent(function(e) {
        clearTimeout(timeoutId);
        
        timeoutId = setTimeout(() => {
          window.ReactNativeWebView.postMessage(JSON.stringify({
            type: 'change',
            content: window.editor.getValue()
          }));
        }, 100);
      });
    });

    // Handle messages from React Native
    document.addEventListener('message', function(event) {
       handleMessage(event);
    });
    window.addEventListener('message', function(event) {
       handleMessage(event);
    });

    function handleMessage(event) {
       try {
         const data = JSON.parse(event.data);
         if (!window.editor) return;

         if (data.type === 'setLanguage') {
           monaco.editor.setModelLanguage(window.editor.getModel(), data.language);
         }
         if (data.type === 'setValue') {
           if (window.editor.getValue() !== data.value) {
             window.editor.setValue(data.value);
           }
         }
         if (data.type === 'setTheme') {
           monaco.editor.setTheme(data.theme);
         }
         if (data.type === 'insertText') {
           window.editor.trigger('keyboard', 'type', {text: data.text});
           window.editor.focus();
         }
         if (data.type === 'getSelection') {
           const selection = window.editor.getSelection();
           const selectedText = window.editor.getModel().getValueInRange(selection);
           window.ReactNativeWebView.postMessage(JSON.stringify({
             type: 'selectionResult',
             content: selectedText
           }));
         }
       } catch (e) {
         // ignore
       }
    }
  </script>
</body>
</html>
`, []); // Empty dependency array to prevent reload on prop change

  useEffect(() => {
    if (webViewRef.current && initialCode) {
      // Use setTimeout to ensure WebView has processed the initial HTML
      setTimeout(() => {
        webViewRef.current?.postMessage(JSON.stringify({ type: 'setValue', value: initialCode }));
      }, 100);
    }
  }, [initialCode]);

  useEffect(() => {
    if (webViewRef.current) {
      webViewRef.current.postMessage(JSON.stringify({ type: 'setLanguage', language }));
    }
  }, [language]);

  useEffect(() => {
    if (webViewRef.current) {
      webViewRef.current.postMessage(JSON.stringify({ type: 'setTheme', theme }));
    }
  }, [theme]);

  const selectionPromiseRef = useRef<((value: string) => void) | null>(null);

  const handleMessage = (event: any) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      if (data.type === 'change') {
        onChange(data.content);
      } else if (data.type === 'selectionResult') {
        if (selectionPromiseRef.current) {
          selectionPromiseRef.current(data.content);
          selectionPromiseRef.current = null;
        }
      }
    } catch (e) {
      console.error('Error parsing message from WebView', e);
    }
  };

  const insertText = (text: string) => {
    if (webViewRef.current) {
      webViewRef.current.postMessage(JSON.stringify({ type: 'insertText', text }));
    }
  };

  const focus = () => {
    if (webViewRef.current) {
      // Inject JS to force focus
      webViewRef.current.injectJavaScript(`
        if (window.editor) {
           window.editor.focus();
           const textarea = document.querySelector('textarea');
           if (textarea) textarea.focus();
        }
        true;
      `);
    }
  };

  const getSelectedText = (): Promise<string> => {
    return new Promise((resolve) => {
      selectionPromiseRef.current = resolve;
      if (webViewRef.current) {
        webViewRef.current.postMessage(JSON.stringify({ type: 'getSelection' }));
      } else {
        resolve('');
      }
      // Timeout zapobiegający zablokowaniu Promise
      setTimeout(() => {
        if (selectionPromiseRef.current) {
          selectionPromiseRef.current('');
          selectionPromiseRef.current = null;
        }
      }, 1000);
    });
  };

  React.useImperativeHandle(ref, () => ({
    insertText,
    focus,
    getSelectedText
  }));

  return (
    <View style={styles.container}>
      <WebView
        ref={webViewRef}
        source={{ html: htmlContent }}
        onMessage={handleMessage}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        startInLoadingState={true}
        renderLoading={() => <ActivityIndicator size="large" color="#0000ff" />}
        originWhitelist={['*']}
        keyboardDisplayRequiresUserAction={false}
        // Enable scrolling to help with input field detection
        scrollEnabled={true}
        bounces={false}
        overScrollMode="never"
        textZoom={100}
        // Android specific
        onLoadEnd={() => {
          if (Platform.OS === 'android') {
             webViewRef.current?.injectJavaScript('if(document.querySelector("textarea")) document.querySelector("textarea").focus(); true;');
          }
        }}
      />
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});

export default CodeEditor;
