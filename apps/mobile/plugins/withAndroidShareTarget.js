const {
  withAndroidManifest,
  withDangerousMod,
  withAndroidStyles,
} = require('@expo/config-plugins');
const fs = require('fs');
const path = require('path');

/**
 * Enhanced Share Target Plugin
 * 1. Definitive removal of duplicate icons.
 * 2. Proper Intent handling for CaptureActivity.
 */
function withAndroidShareTarget(config) {
  // 1. Precise Manifest Modification
  config = withAndroidManifest(config, (config) => {
    const manifest = config.modResults.manifest;
    const application = manifest.application[0];
    const activities = application.activity || [];

    // Aggressively remove all SEND/SEND_MULTIPLE filters from ALL activities EXCEPT CaptureActivity
    activities.forEach((activity) => {
      const name = activity.$['android:name'] || '';

      // We only want SEND/SEND_MULTIPLE on CaptureActivity
      if (!name.endsWith('.CaptureActivity')) {
        let filters = activity['intent-filter'];
        if (filters) {
          if (!Array.isArray(filters)) filters = [filters];

          activity['intent-filter'] = filters.filter((filter) => {
            const actions = Array.isArray(filter.action)
              ? filter.action
              : filter.action
                ? [filter.action]
                : [];
            const hasSendAction = actions.some((action) => {
              const actionName = action?.$?.['android:name'];
              return (
                actionName === 'android.intent.action.SEND' ||
                actionName === 'android.intent.action.SEND_MULTIPLE'
              );
            });

            // LOG FOR DEBUGGING - this will show up in prebuild logs
            if (hasSendAction) {
              console.log(`[withAndroidShareTarget] Removing SEND intent from ${name}`);
            }

            return !hasSendAction;
          });
        }
      }

      // Ensure MainActivity remains singleTask
      if (name.endsWith('.MainActivity')) {
        activity.$['android:launchMode'] = 'singleTask';
      }
    });

    // Add or Update CaptureActivity (The Dialog View)
    const captureActivityProps = {
      $: {
        'android:name': '.CaptureActivity',
        'android:label': config.name || '9naŭ IG',
        'android:theme': '@style/AppTheme.CaptureDialog',
        'android:excludeFromRecents': 'true',
        'android:launchMode': 'singleTop',
        'android:documentLaunchMode': 'always',
        'android:taskAffinity': '', // Important for keeping it separate from Main Task
        'android:exported': 'true',
        'android:windowSoftInputMode': 'adjustResize',
      },
      'intent-filter': [
        {
          $: { 'android:label': config.name || '9naŭ IG' },
          action: [{ $: { 'android:name': 'android.intent.action.SEND' } }],
          category: [{ $: { 'android:name': 'android.intent.category.DEFAULT' } }],
          data: [{ $: { 'android:mimeType': 'text/plain' } }],
        },
      ],
    };

    const existingCaptureIdx = activities.findIndex((a) =>
      a.$['android:name']?.endsWith('.CaptureActivity'),
    );

    if (existingCaptureIdx > -1) {
      activities[existingCaptureIdx] = captureActivityProps;
    } else {
      activities.push(captureActivityProps);
    }

    return config;
  });

  // 2. Inject Styles (Dialog Theme)
  config = withAndroidStyles(config, (config) => {
    const styles = config.modResults.resources.style || [];
    const hasTheme = styles.some((s) => s.$.name === 'AppTheme.CaptureDialog');

    if (!hasTheme) {
      styles.push({
        $: {
          name: 'AppTheme.CaptureDialog',
          parent: '@style/Theme.AppCompat.Light.NoActionBar',
        },
        item: [
          { $: { name: 'android:windowIsTranslucent' }, _: 'true' },
          { $: { name: 'android:windowBackground' }, _: '@android:color/transparent' },
          { $: { name: 'android:windowContentOverlay' }, _: '@null' },
          { $: { name: 'android:windowNoTitle' }, _: 'true' },
          { $: { name: 'android:windowIsFloating' }, _: 'false' },
          { $: { name: 'android:backgroundDimEnabled' }, _: 'false' },
          { $: { name: 'android:windowAnimationStyle' }, _: '@null' },
        ],
      });
    }
    return config;
  });

  // 3. Robust Kotlin File (Handling Intents & React Context)
  config = withDangerousMod(config, [
    'android',
    async (config) => {
      const packageName = config.android?.package || 'com.nau.ig';
      const packagePath = packageName.replace(/\./g, '/');
      const projectRoot = config.modRequest.projectRoot;
      const filePath = path.join(
        projectRoot,
        'android/app/src/main/java',
        packagePath,
        'CaptureActivity.kt',
      );

      const kotlinCode = `package ${packageName}

import android.os.Bundle
import android.content.Intent
import com.facebook.react.ReactActivity
import com.facebook.react.ReactActivityDelegate
import com.facebook.react.defaults.DefaultNewArchitectureEntryPoint.fabricEnabled
import com.facebook.react.defaults.DefaultReactActivityDelegate
import expo.modules.ReactActivityDelegateWrapper

class CaptureActivity : ReactActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        // Apply dialog theme BEFORE onCreate
        setTheme(R.style.AppTheme_CaptureDialog)
        super.onCreate(null)
        android.util.Log.d("CaptureActivity", "onCreate with intent: \${intent?.action}")
    }

    /**
     * Required for expo-share-intent to pick up the intent
     * when the activity is already running or newly created.
     */
    override fun onNewIntent(intent: Intent) {
        super.onNewIntent(intent)
        setIntent(intent)
        android.util.Log.d("CaptureActivity", "onNewIntent: \${intent?.action}")
    }

    override fun getMainComponentName(): String = "main"

    override fun createReactActivityDelegate(): ReactActivityDelegate {
        return ReactActivityDelegateWrapper(
            this,
            BuildConfig.IS_NEW_ARCHITECTURE_ENABLED,
            object : DefaultReactActivityDelegate(
                this,
                mainComponentName,
                fabricEnabled
            ) {
                override fun getLaunchOptions(): Bundle? {
                    val initialProps = Bundle()
                    initialProps.putBoolean("isCapture", true)
                    return initialProps
                }
            }
        )
    }
}
`;
      if (fs.existsSync(path.join(projectRoot, 'android'))) {
        const dir = path.dirname(filePath);
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
        fs.writeFileSync(filePath, kotlinCode);
      }
      return config;
    },
  ]);

  return config;
}

module.exports = withAndroidShareTarget;
