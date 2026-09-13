import { StatusBar } from "expo-status-bar";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useEffect, useState } from "react";
import {
  Alert,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

type Label = { id: string; name: string; price: string };
const initialLabels: Label[] = [
  { id: "1", name: "Kaju Katli", price: "450" },
  { id: "2", name: "Mysore Pak", price: "380" },
  { id: "3", name: "Motichoor Laddu", price: "320" },
];
const STORAGE_KEY = "label-printer-labels";

export default function App() {
  const [labels, setLabels] = useState(initialLabels);
  const [activeId, setActiveId] = useState("1");
  const [name, setName] = useState("Kaju Katli");
  const [price, setPrice] = useState("450");

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then(stored => {
      if (!stored) return;
      const saved = JSON.parse(stored) as Label[];
      if (saved.length) {
        setLabels(saved);
        selectLabel(saved[0]);
      }
    });
  }, []);

  const selectLabel = (label: Label) => {
    setActiveId(label.id);
    setName(label.name);
    setPrice(label.price);
  };
  const saveLabel = () => {
    if (!name.trim() || !price.trim()) {
      Alert.alert("Complete the label", "Add a product name and price first.");
      return;
    }
    const nextLabels = labels.map(label =>
      label.id === activeId ? { ...label, name: name.trim(), price: price.trim() } : label,
    );
    setLabels(nextLabels);
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(nextLabels));
  };
  const addLabel = () => {
    const label = { id: `${Date.now()}`, name: "New product", price: "0" };
    const nextLabels = [...labels, label];
    setLabels(nextLabels);
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(nextLabels));
    selectLabel(label);
  };
  const exportPdf = async () => {
    try {
      const { printToFileAsync } = await import("expo-print");
      const { uri } = await printToFileAsync({ html: createPdfMarkup(name, price) });
      const { isAvailableAsync, shareAsync } = await import("expo-sharing");
      if (await isAvailableAsync()) await shareAsync(uri, { mimeType: "application/pdf" });
      else Alert.alert("PDF ready", uri);
    } catch {
      Alert.alert(
        "Export unavailable",
        "Install Expo Print and Sharing to export this label sheet.",
      );
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.header}>
          <View>
            <Text style={styles.eyebrow}>KOSELI SUPPLIERS</Text>
            <Text style={styles.title}>Label studio</Text>
          </View>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>2-UP</Text>
          </View>
        </View>
        <View style={styles.hero}>
          <View style={styles.heroCopy}>
            <Text style={styles.heroTitle}>Print-ready labels, made simple.</Text>
            <Text style={styles.heroSub}>
              Build a saved label once. Export a precise two-up sheet whenever you need it.
            </Text>
          </View>
          <Text style={styles.heroMark}>✦</Text>
        </View>
        <View style={styles.sectionHeading}>
          <Text style={styles.sectionTitle}>Your labels</Text>
          <Text style={styles.count}>{labels.length} saved</Text>
        </View>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.labelList}>
          {labels.map(label => (
            <Pressable
              key={label.id}
              onPress={() => selectLabel(label)}
              style={[styles.labelChip, label.id === activeId && styles.labelChipActive]}>
              <Text style={[styles.chipName, label.id === activeId && styles.chipNameActive]}>
                {label.name}
              </Text>
              <Text style={styles.chipPrice}>Rs. {label.price}</Text>
            </Pressable>
          ))}
          <Pressable onPress={addLabel} style={styles.addChip}>
            <Text style={styles.addIcon}>+</Text>
            <Text style={styles.addText}>Add label</Text>
          </Pressable>
        </ScrollView>
        <View style={styles.workspace}>
          <View style={styles.editor}>
            <Text style={styles.kicker}>EDIT LABEL</Text>
            <Text style={styles.panelTitle}>Product details</Text>
            <Text style={styles.inputLabel}>Product name</Text>
            <TextInput
              value={name}
              onChangeText={setName}
              placeholder="e.g. Kaju Katli"
              placeholderTextColor="#9a968d"
              style={styles.input}
            />
            <Text style={styles.inputLabel}>Price</Text>
            <View style={styles.priceInput}>
              <Text style={styles.currency}>Rs.</Text>
              <TextInput
                value={price}
                onChangeText={setPrice}
                keyboardType="decimal-pad"
                style={styles.priceText}
              />
            </View>
            <View style={styles.editorActions}>
              <Pressable
                onPress={() => {
                  if (labels.length === 1) return;
                  const nextLabels = labels.filter(label => label.id !== activeId);
                  setLabels(nextLabels);
                  AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(nextLabels));
                  selectLabel(nextLabels[0]);
                }}>
                <Text style={styles.deleteText}>Delete</Text>
              </Pressable>
              <Pressable onPress={saveLabel} style={styles.saveButton}>
                <Text style={styles.saveText}>Save changes</Text>
              </Pressable>
            </View>
          </View>
          <View style={styles.preview}>
            <View style={styles.previewHeader}>
              <View>
                <Text style={styles.kicker}>LIVE PREVIEW</Text>
                <Text style={styles.panelTitle}>Two-up sheet</Text>
              </View>
              <Text style={styles.dimension}>72 x 22 mm</Text>
            </View>
            <View style={styles.sheet}>
              <Sticker name={name} price={price} />
              <Sticker name={name} price={price} />
            </View>
            <Text style={styles.note}>Each sticker 33 x 19 mm · 2 mm gap</Text>
          </View>
        </View>
        <Pressable onPress={exportPdf} style={styles.exportButton}>
          <Text style={styles.exportIcon}>↗</Text>
          <View>
            <Text style={styles.exportTitle}>Export PDF</Text>
            <Text style={styles.exportSub}>Create a print-ready two-up file</Text>
          </View>
          <Text style={styles.exportArrow}>›</Text>
        </Pressable>
        <Text style={styles.footer}>
          PDF uses the exact 72 x 22 mm row size for your label printer.
        </Text>
      </ScrollView>
      <StatusBar style="dark" />
    </SafeAreaView>
  );
}

function Sticker({ name, price }: { name: string; price: string }) {
  return (
    <View style={styles.sticker}>
      <Text style={styles.stickerSmall}>Importer &amp; Marketer:</Text>
      <Text style={styles.stickerBrand}>KOSELI SUPPLIERS</Text>
      <Text style={styles.stickerInfo}>Bharat Nagar, Nepal{`\n`}Food product</Text>
      <Text style={styles.stickerName}>{name || "Product name"}</Text>
      <Text style={styles.stickerWeight}>Net Weight: 100g</Text>
      <Text style={styles.stickerPrice}>MRP.(NPR) Rs. {price || "0"} /-</Text>
    </View>
  );
}
function createPdfMarkup(name: string, price: string) {
  const sticker = `<div class="sticker"><b>Importer &amp; Marketer:</b><strong>KOSELI SUPPLIERS</strong><small>Bharat Nagar, Nepal<br>Food product</small><strong>${name}</strong><small>Net Weight: 100g</small><b>MRP.(NPR) Rs. ${price} /-</b></div>`;
  return `<html><head><style>@page{size:72mm 22mm;margin:0}body{margin:0;width:72mm;height:22mm;display:flex;align-items:center;justify-content:center;gap:2mm;font-family:Georgia;color:#222}.sticker{width:33mm;height:19mm;padding:1.5mm 2mm;font-size:5.5pt;line-height:1.05}.sticker strong{display:block;font-size:7pt}.sticker small{display:block;font-size:5pt}</style></head><body>${sticker}${sticker}</body></html>`;
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#f7f5ef" },
  container: { padding: 24, paddingBottom: 44, maxWidth: 980, width: "100%", alignSelf: "center" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 26,
  },
  eyebrow: { color: "#b35d3b", fontSize: 11, fontWeight: "800", letterSpacing: 1.8 },
  title: { color: "#1e2521", fontSize: 28, fontWeight: "800", marginTop: 3 },
  badge: {
    borderWidth: 1,
    borderColor: "#d9d3c7",
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
  },
  badgeText: { color: "#6e726b", fontSize: 11, fontWeight: "800", letterSpacing: 1.4 },
  hero: {
    backgroundColor: "#21443d",
    borderRadius: 5,
    padding: 23,
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 27,
  },
  heroCopy: { maxWidth: 580 },
  heroTitle: { color: "#fcf9f0", fontSize: 24, fontWeight: "800" },
  heroSub: { color: "#c8d5c9", fontSize: 13, lineHeight: 20, marginTop: 7 },
  heroMark: { color: "#e8b579", fontSize: 45 },
  sectionHeading: { flexDirection: "row", alignItems: "baseline", gap: 10, marginBottom: 11 },
  sectionTitle: { color: "#252923", fontSize: 18, fontWeight: "800" },
  count: { color: "#928f85", fontSize: 12 },
  labelList: { gap: 9, paddingBottom: 21 },
  labelChip: {
    backgroundColor: "#fffdf8",
    borderWidth: 1,
    borderColor: "#e3ded3",
    borderRadius: 4,
    paddingHorizontal: 14,
    paddingVertical: 11,
    minWidth: 128,
  },
  labelChipActive: { backgroundColor: "#e6eee7", borderColor: "#7d9e87" },
  chipName: { color: "#363a34", fontSize: 13, fontWeight: "700" },
  chipNameActive: { color: "#21443d" },
  chipPrice: { color: "#918e84", fontSize: 11, marginTop: 4 },
  addChip: {
    borderWidth: 1,
    borderStyle: "dashed",
    borderColor: "#c8c3b8",
    borderRadius: 4,
    paddingHorizontal: 14,
    paddingVertical: 11,
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
  },
  addIcon: { color: "#b35d3b", fontSize: 20 },
  addText: { color: "#716f68", fontSize: 13, fontWeight: "700" },
  workspace: { gap: 16, flexDirection: "row", flexWrap: "wrap" },
  editor: {
    backgroundColor: "#fffdf8",
    borderWidth: 1,
    borderColor: "#e5e0d6",
    borderRadius: 5,
    padding: 19,
    flex: 1,
    minWidth: 270,
  },
  preview: { backgroundColor: "#ece9e1", borderRadius: 5, padding: 19, flex: 1.35, minWidth: 310 },
  kicker: { color: "#b35d3b", fontSize: 10, fontWeight: "800", letterSpacing: 1.4 },
  panelTitle: { color: "#283029", fontSize: 18, fontWeight: "800", marginTop: 3, marginBottom: 20 },
  inputLabel: { color: "#6b6b62", fontSize: 11, fontWeight: "700", marginBottom: 7 },
  input: {
    borderWidth: 1,
    borderColor: "#ded9cf",
    borderRadius: 3,
    padding: 12,
    color: "#283029",
    fontSize: 14,
    marginBottom: 14,
    backgroundColor: "#fffefa",
  },
  priceInput: {
    borderWidth: 1,
    borderColor: "#ded9cf",
    borderRadius: 3,
    flexDirection: "row",
    alignItems: "center",
    paddingLeft: 12,
    marginBottom: 23,
    backgroundColor: "#fffefa",
  },
  currency: { color: "#8b887e", fontSize: 13, fontWeight: "700" },
  priceText: { flex: 1, padding: 12, color: "#283029", fontSize: 14 },
  editorActions: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  deleteText: { color: "#a26755", fontSize: 12, fontWeight: "700", paddingVertical: 10 },
  saveButton: {
    backgroundColor: "#b35d3b",
    paddingHorizontal: 15,
    paddingVertical: 11,
    borderRadius: 3,
  },
  saveText: { color: "#fffaf2", fontSize: 12, fontWeight: "800" },
  previewHeader: { flexDirection: "row", justifyContent: "space-between" },
  dimension: { color: "#7f8077", fontSize: 11 },
  sheet: {
    backgroundColor: "#fff",
    height: 110,
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 9,
    borderWidth: 1,
    borderColor: "#dbd7cd",
    marginBottom: 10,
  },
  sticker: {
    backgroundColor: "#faf9f4",
    borderWidth: 1,
    borderColor: "#dfdcd3",
    width: "43%",
    height: 94,
    padding: 6,
    justifyContent: "center",
  },
  stickerSmall: { color: "#1e2420", fontSize: 6 },
  stickerBrand: { color: "#1e2420", fontSize: 9, fontWeight: "900" },
  stickerInfo: { color: "#30342f", fontSize: 5, lineHeight: 6 },
  stickerName: { color: "#1e2420", fontSize: 8, fontWeight: "900", marginTop: 4 },
  stickerWeight: { color: "#1e2420", fontSize: 6, fontWeight: "700" },
  stickerPrice: { color: "#1e2420", fontSize: 6, fontWeight: "900", marginTop: 2 },
  note: { color: "#85857c", fontSize: 10 },
  exportButton: {
    backgroundColor: "#e8b579",
    borderRadius: 4,
    padding: 16,
    marginTop: 18,
    flexDirection: "row",
    alignItems: "center",
  },
  exportIcon: { color: "#5c3e2a", fontSize: 27, marginRight: 13 },
  exportTitle: { color: "#4d3525", fontSize: 15, fontWeight: "900" },
  exportSub: { color: "#806144", fontSize: 11, marginTop: 2 },
  exportArrow: { color: "#5c3e2a", fontSize: 28, marginLeft: "auto" },
  footer: { color: "#9b978c", textAlign: "center", fontSize: 10, marginTop: 15 },
});
