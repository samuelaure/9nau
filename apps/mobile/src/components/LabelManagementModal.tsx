import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    Modal,
    ScrollView,
    KeyboardAvoidingView,
    Platform,
} from 'react-native';
import { Check, Pencil, Trash2, Tag, X } from 'lucide-react-native';
import { Label, getAllLabels, createLabel, updateLabel, deleteLabel } from '@/repositories/LabelRepository';
import { COLORS } from '@/constants';

interface LabelManagementModalProps {
    visible: boolean;
    onClose: () => void;
    onLabelsChanged?: () => void;
}

export const LabelManagementModal: React.FC<LabelManagementModalProps> = ({
    visible,
    onClose,
    onLabelsChanged,
}) => {
    const [labels, setLabels] = useState<Label[]>([]);
    const [newLabelName, setNewLabelName] = useState('');
    const [editingLabelId, setEditingLabelId] = useState<number | null>(null);
    const [editingName, setEditingName] = useState('');

    useEffect(() => {
        if (visible) {
            loadLabels();
        }
    }, [visible]);

    const loadLabels = async () => {
        const data = await getAllLabels();
        setLabels(data);
    };

    const handleCreate = async () => {
        if (!newLabelName.trim()) return;
        try {
            await createLabel(newLabelName.trim());
            setNewLabelName('');
            await loadLabels();
            onLabelsChanged?.();
        } catch (error) {
            console.error('Failed to create label:', error);
        }
    };

    const handleUpdate = async (id: number) => {
        if (!editingName.trim()) return;
        try {
            await updateLabel(id, editingName.trim());
            setEditingLabelId(null);
            await loadLabels();
            onLabelsChanged?.();
        } catch (error) {
            console.error('Failed to update label:', error);
        }
    };

    const handleDelete = async (id: number) => {
        try {
            await deleteLabel(id);
            await loadLabels();
            onLabelsChanged?.();
        } catch (error) {
            console.error('Failed to delete label:', error);
        }
    };

    return (
        <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
            <View style={styles.overlay}>
                <KeyboardAvoidingView
                    behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                    style={styles.container}
                >
                    <View style={styles.content}>
                        <Text style={styles.title}>Edit labels</Text>

                        {/* Create New Label */}
                        <View style={styles.row}>
                            <TouchableOpacity onPress={() => setNewLabelName('')} style={styles.iconBtn}>
                                <X size={20} color={newLabelName ? COLORS.textSecondary : '#e0e0e0'} />
                            </TouchableOpacity>
                            <TextInput
                                style={styles.input}
                                placeholder="Create new label"
                                value={newLabelName}
                                onChangeText={setNewLabelName}
                                onSubmitEditing={handleCreate}
                            />
                            <TouchableOpacity onPress={handleCreate} style={styles.iconBtn} disabled={!newLabelName}>
                                <Check size={20} color={newLabelName ? COLORS.primary : '#e0e0e0'} />
                            </TouchableOpacity>
                        </View>

                        <ScrollView style={styles.labelList}>
                            {labels.map((label) => (
                                <View key={label.id} style={styles.row}>
                                    {editingLabelId === label.id ? (
                                        <TouchableOpacity onPress={() => handleDelete(label.id)} style={styles.iconBtn}>
                                            <Trash2 size={20} color={COLORS.textSecondary} />
                                        </TouchableOpacity>
                                    ) : (
                                        <View style={styles.iconBtn}>
                                            <Tag size={20} color={COLORS.textSecondary} />
                                        </View>
                                    )}

                                    <TextInput
                                        style={[styles.input, editingLabelId === label.id && styles.inputEditing]}
                                        value={editingLabelId === label.id ? editingName : label.name}
                                        onChangeText={setEditingName}
                                        onFocus={() => {
                                            setEditingLabelId(label.id);
                                            setEditingName(label.name);
                                        }}
                                        onSubmitEditing={() => handleUpdate(label.id)}
                                    />

                                    {editingLabelId === label.id ? (
                                        <TouchableOpacity onPress={() => handleUpdate(label.id)} style={styles.iconBtn}>
                                            <Check size={20} color={COLORS.primary} />
                                        </TouchableOpacity>
                                    ) : (
                                        <TouchableOpacity
                                            onPress={() => {
                                                setEditingLabelId(label.id);
                                                setEditingName(label.name);
                                            }}
                                            style={styles.iconBtn}
                                        >
                                            <Pencil size={20} color={COLORS.textSecondary} />
                                        </TouchableOpacity>
                                    )}
                                </View>
                            ))}
                        </ScrollView>

                        <View style={styles.footer}>
                            <TouchableOpacity onPress={onClose} style={styles.doneBtn}>
                                <Text style={styles.doneBtnText}>Done</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </KeyboardAvoidingView>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    container: {
        backgroundColor: COLORS.background,
        borderRadius: 8,
        maxWidth: 400,
        overflow: 'hidden',
        width: '90%',
    },
    content: {
        padding: 16,
    },
    doneBtn: {
        paddingHorizontal: 24,
        paddingVertical: 10,
    },
    doneBtnText: {
        color: COLORS.dark,
        fontSize: 14,
        fontWeight: '700',
    },
    footer: {
        alignItems: 'flex-end',
        borderTopColor: COLORS.border,
        borderTopWidth: 1,
        marginTop: 12,
        paddingTop: 12,
    },
    iconBtn: {
        alignItems: 'center',
        height: 48,
        justifyContent: 'center',
        width: 48,
    },
    input: {
        borderBottomColor: 'transparent',
        borderBottomWidth: 1,
        color: COLORS.dark,
        flex: 1,
        fontSize: 16,
        paddingVertical: 8,
    },
    inputEditing: {
        borderBottomColor: COLORS.border,
    },
    labelList: {
        marginTop: 8,
        maxHeight: 300,
    },
    overlay: {
        alignItems: 'center',
        backgroundColor: COLORS.overlay,
        flex: 1,
        justifyContent: 'center',
    },
    row: {
        alignItems: 'center',
        flexDirection: 'row',
        height: 48,
        marginBottom: 8,
    },
    title: {
        color: COLORS.dark,
        fontSize: 18,
        fontWeight: '700',
        marginBottom: 20,
        paddingHorizontal: 8,
    },
});
