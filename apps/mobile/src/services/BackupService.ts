import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { Alert } from 'react-native';
import { DATABASE_NAME } from '@/constants';

export class BackupService {
    /**
     * Creates a backup of the SQLite database and prompts the user to share/save it.
     */
    static async exportDatabase(): Promise<void> {
        try {
            // The location of the SQLite database
            // Expo SQLite stores files in the 'SQLite' directory inside documentDirectory
            const dbDir = FileSystem.documentDirectory + 'SQLite/';
            const dbPath = dbDir + DATABASE_NAME;

            // Check if DB exists
            const fileInfo = await FileSystem.getInfoAsync(dbPath);
            if (!fileInfo.exists) {
                Alert.alert('Error', 'Database file not found.');
                return;
            }

            // Create a backup file path with timestamp
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
            const backupFilename = `nau-ig-backup-${timestamp}.db`;
            const backupPath = (FileSystem.documentDirectory || '') + backupFilename;

            // Copy the database to the backup location
            await FileSystem.copyAsync({
                from: dbPath,
                to: backupPath,
            });

            // Share the file
            if (await Sharing.isAvailableAsync()) {
                await Sharing.shareAsync(backupPath, {
                    dialogTitle: 'Save Database Backup',
                    UTI: 'com.sqlite.database', // Uniform Type Identifier for iOS
                    mimeType: 'application/x-sqlite3', // Mime type for Android
                });
            } else {
                Alert.alert('Error', 'Sharing is not available on this device');
            }
        } catch (error) {
            console.error('Backup failed:', error);
            const message = error instanceof Error ? error.message : 'An unknown error occurred';
            Alert.alert('Backup Failed', message);
        }
    }
}
