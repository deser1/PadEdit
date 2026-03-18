import React, { useRef, useEffect, useState } from 'react';
import { View, StyleSheet, ActivityIndicator } from 'react-native';
import { WebView } from 'react-native-webview';

interface CodeEditorProps {
  initialCode: string;
  language: string;
  onChange: (code: string) => void;
  theme?: 'vs-dark' | 'vs-light';
}

const CodeEditor: React.FC<CodeEditorProps> = ({ initialCode, language, onChange, theme = 'vs-dark' }) => {
  const webViewRef = useRef<WebView>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  const htmlContent = `
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
        minimap: { enabled: false }
      });

      window.editor.onDidChangeModelContent(function() {
        window.ReactNativeWebView.postMessage(JSON.stringify({
          type: 'change',
          content: window.editor.getValue()
        }));
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
       } catch (e) {
         // ignore
       }
    }
  </script>
</body>
</html>
`;

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

  const handleMessage = (event: any) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      if (data.type === 'change') {
        onChange(data.content);
      }
    } catch (e) {
      console.error('Error parsing message from WebView', e);
    }
  };

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
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});

export default CodeEditor;
