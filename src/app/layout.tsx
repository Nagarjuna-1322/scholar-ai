import type { Metadata } from 'next';
import './globals.css';
import { Toaster } from '@/components/ui/toaster';
import { ProfileProvider } from '@/contexts/ProfileContext';
import { ApplicationTrackerProvider } from '@/contexts/ApplicationTrackerContext';
import { ScholarshipProvider } from '@/contexts/ScholarshipContext';
import { AppLayout } from '@/components/AppLayout';
import { ScholarshipUpdateModal } from '@/components/ScholarshipUpdateModal';

export const metadata: Metadata = {
  title: 'ScholarAI',
  description: 'AI-Powered Scholarship Finder',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Space+Grotesk:wght@500;700&family=Source+Code+Pro&display=swap"
          rel="stylesheet"
        />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                function cleanNode(node) {
                  if (node && node.removeAttribute) {
                    if (node.hasAttribute('fdprocessedid')) {
                      node.removeAttribute('fdprocessedid');
                    }
                  }
                }
                if (typeof MutationObserver !== 'undefined' && document.documentElement) {
                  var observer = new MutationObserver(function(mutations) {
                    for (var i = 0; i < mutations.length; i++) {
                      var m = mutations[i];
                      if (m.type === 'attributes' && m.attributeName === 'fdprocessedid') {
                        cleanNode(m.target);
                      } else if (m.type === 'childList') {
                        for (var j = 0; j < m.addedNodes.length; j++) {
                          var n = m.addedNodes[j];
                          if (n.nodeType === 1) {
                            cleanNode(n);
                            if (n.querySelectorAll) {
                              var list = n.querySelectorAll('[fdprocessedid]');
                              for (var k = 0; k < list.length; k++) {
                                list[k].removeAttribute('fdprocessedid');
                              }
                            }
                          }
                        }
                      }
                    }
                  });
                  observer.observe(document.documentElement, {
                    subtree: true,
                    childList: true,
                    attributes: true,
                    attributeFilter: ['fdprocessedid']
                  });
                }
              })();
              window.addEventListener('error', function(e) {
                if (e && e.message && (e.message.indexOf('ChunkLoadError') !== -1 || e.message.indexOf('Loading chunk') !== -1)) {
                  var sessionKey = 'scholarai_last_chunk_reload';
                  var lastReload = sessionStorage.getItem(sessionKey);
                  var now = Date.now();
                  if (!lastReload || now - parseInt(lastReload, 10) > 10000) {
                    sessionStorage.setItem(sessionKey, String(now));
                    window.location.reload();
                  }
                }
              });
            `,
          }}
        />
      </head>
      <body className="font-body antialiased" suppressHydrationWarning>
          <ProfileProvider>
            <ApplicationTrackerProvider>
              <ScholarshipProvider>
                <AppLayout>
                  {children}
                </AppLayout>
                <ScholarshipUpdateModal />
                <Toaster />
              </ScholarshipProvider>
            </ApplicationTrackerProvider>
          </ProfileProvider>
      </body>
    </html>
  );
}
