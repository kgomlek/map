/**
 * Sayfa Deneysel - Çok Taraflı Takas Döngüsü Tespiti
 * Araç takas döngülerini tespit eden sistem
 */

'use client';

import { useState, useMemo, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/presentation/components/ui/card';
import { Button } from '@/presentation/components/ui/button';
import { Input } from '@/presentation/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/presentation/components/ui/table';
import { Badge } from '@/presentation/components/ui/badge';
import { Plus, Trash2, ArrowRight, DollarSign } from 'lucide-react';
import type { Trader, TradeCycle } from '@/domain/types';

// Araba markaları ve fiyatları (TL cinsinden ortalama piyasa değeri)
const CAR_BASE_PRICES: Record<string, number> = {
  BMW: 1200000,
  Audi: 1100000,
  Mercedes: 1300000,
  Opel: 600000,
  Ford: 700000,
  Toyota: 800000,
  Honda: 750000,
  Volkswagen: 650000,
  Renault: 550000,
  Peugeot: 600000,
  Togg: 2000000,
  Tesla: 2500000,
  Hyundai: 600000,
  Kia: 550000,
  Fiat: 500000,
  Dacia: 400000,
  Skoda: 650000,
  Seat: 600000,
  Nissan: 700000,
  Mazda: 750000,
  Volvo: 900000,
  Mini: 800000,
  Citroen: 550000,
};

// Durum çarpanları
const CONDITION_MULTIPLIERS: Record<string, number> = {
  Mükemmel: 1.0, // %100
  İyi: 0.85, // %85
  Orta: 0.70, // %70
  Kötü: 0.50, // %50
};

// Kilometre çarpanları (her 10.000 km için %2 azalma)
function getKilometerMultiplier(kilometrage: number): number {
  const depreciationPer10k = 0.02; // Her 10.000 km için %2 değer kaybı
  const kmFactor = Math.max(0.3, 1 - (kilometrage / 10000) * depreciationPer10k); // Minimum %30 değer
  return kmFactor;
}

/**
 * Araba fiyatını otomatik hesapla
 */
function calculateCarPrice(
  carBrand: string,
  kilometrage: number,
  condition: 'Mükemmel' | 'İyi' | 'Orta' | 'Kötü'
): { basePrice: number; finalPrice: number } {
  // Temel fiyatı al (marka bilinmiyorsa varsayılan 500.000 TL)
  const basePrice = CAR_BASE_PRICES[carBrand] || 500000;

  // Kilometre çarpanı
  const kmMultiplier = getKilometerMultiplier(kilometrage);

  // Durum çarpanı
  const conditionMultiplier = CONDITION_MULTIPLIERS[condition] || 0.7;

  // Final fiyat = Temel fiyat × Kilometre çarpanı × Durum çarpanı
  const finalPrice = Math.round(basePrice * kmMultiplier * conditionMultiplier);

  return { basePrice, finalPrice };
}

// Test için varsayılan veriler (fiyatlar otomatik hesaplanmış)
const createDefaultTrader = (
  id: string,
  name: string,
  hasCar: string,
  wantsCar: string,
  kilometrage: number,
  condition: 'Mükemmel' | 'İyi' | 'Orta' | 'Kötü'
): Trader => {
  const { basePrice, finalPrice } = calculateCarPrice(hasCar, kilometrage, condition);
  return {
    id,
    name,
    hasCar,
    wantsCar,
    kilometrage,
    condition,
    basePrice,
    price: finalPrice,
    budget: 0,
  };
};

const DEFAULT_TRADERS: Trader[] = [
  createDefaultTrader('1', 'Serap', 'BMW', 'Opel', 50000, 'İyi'),
  createDefaultTrader('2', 'Bayram', 'Audi', 'BMW', 30000, 'Mükemmel'),
  createDefaultTrader('3', 'Ufuk', 'Opel', 'Audi', 80000, 'Orta'),
  createDefaultTrader('4', 'Ertuğrul', 'Ford', 'Toyota', 60000, 'İyi'),
  createDefaultTrader('5', 'Mirac', 'Toyota', 'Honda', 40000, 'Mükemmel'),
  createDefaultTrader('6', 'Sare', 'Honda', 'Ford', 70000, 'Orta'),
  createDefaultTrader('7', 'Yigit', 'Togg', 'Tesla', 10000, 'Mükemmel'),
];

export default function TakasPage() {
  const [traders, setTraders] = useState<Trader[]>(DEFAULT_TRADERS);
  const [newTrader, setNewTrader] = useState<Partial<Trader>>({
    name: '',
    hasCar: '',
    wantsCar: '',
    kilometrage: 0,
    condition: 'İyi',
    basePrice: 0,
    price: 0,
    budget: 0,
  });

  // Fiyatı otomatik hesapla
  useEffect(() => {
    if (newTrader.hasCar && newTrader.kilometrage !== undefined && newTrader.condition) {
      const { basePrice, finalPrice } = calculateCarPrice(
        newTrader.hasCar,
        newTrader.kilometrage || 0,
        newTrader.condition
      );
      setNewTrader({
        ...newTrader,
        basePrice,
        price: finalPrice,
      });
    }
  }, [newTrader.hasCar, newTrader.kilometrage, newTrader.condition]);

  // Algorithme de détection de cycles
  const cycles = useMemo(() => {
    return findCycles(traders);
  }, [traders]);

  // Ajouter un nouveau trader
  const handleAddTrader = () => {
    if (!newTrader.name || !newTrader.hasCar || !newTrader.wantsCar) {
      return;
    }

    const { basePrice, finalPrice } = calculateCarPrice(
      newTrader.hasCar,
      newTrader.kilometrage || 0,
      newTrader.condition || 'İyi'
    );

    const trader: Trader = {
      id: Date.now().toString(),
      name: newTrader.name,
      hasCar: newTrader.hasCar,
      wantsCar: newTrader.wantsCar,
      kilometrage: newTrader.kilometrage || 0,
      condition: newTrader.condition || 'İyi',
      basePrice,
      price: finalPrice,
      budget: newTrader.budget || 0,
    };

    setTraders([...traders, trader]);
    setNewTrader({
      name: '',
      hasCar: '',
      wantsCar: '',
      kilometrage: 0,
      condition: 'İyi',
      basePrice: 0,
      price: 0,
      budget: 0,
    });
  };

  // Supprimer un trader
  const handleRemoveTrader = (id: string) => {
    setTraders(traders.filter((t) => t.id !== id));
  };

  // Formater le montant
  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat('tr-TR', {
      style: 'currency',
      currency: 'TRY',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Çok Taraflı Takas Döngüsü Tespiti</h1>
        <p className="text-muted-foreground">
          Trader'lar arasında olası takas döngülerini tespit edin
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Sol sütun: Form ve trader listesi */}
        <Card>
          <CardHeader>
            <CardTitle>Trader Yönetimi</CardTitle>
            <CardDescription>Trader ekleyin veya silin</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Ekleme formu */}
            <div className="space-y-3 p-4 border rounded-lg">
              <h3 className="font-semibold text-sm mb-3">Yeni Trader</h3>
              <div className="grid grid-cols-2 gap-2">
                <Input
                  placeholder="İsim"
                  value={newTrader.name || ''}
                  onChange={(e) => setNewTrader({ ...newTrader, name: e.target.value })}
                />
                <Input
                  placeholder="Sahip olunan araba"
                  value={newTrader.hasCar || ''}
                  onChange={(e) => setNewTrader({ ...newTrader, hasCar: e.target.value })}
                />
                <Input
                  placeholder="İstenen araba"
                  value={newTrader.wantsCar || ''}
                  onChange={(e) => setNewTrader({ ...newTrader, wantsCar: e.target.value })}
                />
                <Input
                  type="number"
                  placeholder="Kilometre (km)"
                  value={newTrader.kilometrage || ''}
                  onChange={(e) =>
                    setNewTrader({
                      ...newTrader,
                      kilometrage: parseInt(e.target.value) || 0,
                    })
                  }
                />
                <select
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  value={newTrader.condition || 'İyi'}
                  onChange={(e) =>
                    setNewTrader({
                      ...newTrader,
                      condition: e.target.value as Trader['condition'],
                    })
                  }
                >
                  <option value="Mükemmel">Mükemmel</option>
                  <option value="İyi">İyi</option>
                  <option value="Orta">Orta</option>
                  <option value="Kötü">Kötü</option>
                </select>
                <div className="col-span-2 space-y-1">
                  <div className="text-xs text-muted-foreground">
                    Temel Fiyat: {newTrader.basePrice ? formatAmount(newTrader.basePrice) : '-'}
                  </div>
                  <div className="text-sm font-semibold text-primary">
                    Hesaplanan Fiyat: {newTrader.price ? formatAmount(newTrader.price) : '-'}
                  </div>
                </div>
                <Input
                  type="number"
                  placeholder="Ekstra bütçe (TL)"
                  value={newTrader.budget || ''}
                  onChange={(e) =>
                    setNewTrader({ ...newTrader, budget: parseFloat(e.target.value) || 0 })
                  }
                />
                <Button onClick={handleAddTrader} className="w-full col-span-2">
                  <Plus className="h-4 w-4 mr-2" />
                  Ekle
                </Button>
              </div>
            </div>

            {/* Trader listesi */}
            <div className="space-y-2">
              <h3 className="font-semibold text-sm">Trader Listesi ({traders.length})</h3>
              <div className="border rounded-lg overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>İsim</TableHead>
                      <TableHead>Sahip</TableHead>
                      <TableHead>İster</TableHead>
                      <TableHead>Km</TableHead>
                      <TableHead>Durum</TableHead>
                      <TableHead>Fiyat</TableHead>
                      <TableHead>İşlem</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {traders.map((trader) => (
                      <TableRow key={trader.id}>
                        <TableCell className="font-medium">{trader.name}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{trader.hasCar}</Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary">{trader.wantsCar}</Badge>
                        </TableCell>
                        <TableCell className="text-sm">
                          {trader.kilometrage.toLocaleString('tr-TR')} km
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              trader.condition === 'Mükemmel'
                                ? 'success'
                                : trader.condition === 'İyi'
                                ? 'default'
                                : trader.condition === 'Orta'
                                ? 'warning'
                                : 'destructive'
                            }
                            className="text-xs"
                          >
                            {trader.condition}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-semibold">
                          {formatAmount(trader.price)}
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleRemoveTrader(trader.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Sağ sütun: Döngü görselleştirme */}
        <Card>
          <CardHeader>
            <CardTitle>Tespit Edilen Takas Döngüleri</CardTitle>
            <CardDescription>
              {cycles.length > 0
                ? `${cycles.length} döngü bulundu`
                : 'Döngü tespit edilmedi'}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {cycles.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <p>Olası takas döngüsü bulunamadı.</p>
                <p className="text-sm mt-2">
                  Bir döngü için her trader'ın bir sonrakinin arabasını istemesi gerekir.
                </p>
              </div>
            ) : (
              cycles.map((cycle, index) => (
                <CycleCard key={index} cycle={cycle} index={index} formatAmount={formatAmount} />
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// Döngü kartı bileşeni
function CycleCard({
  cycle,
  index,
  formatAmount,
}: {
  cycle: TradeCycle;
  index: number;
  formatAmount: (amount: number) => string;
}) {
  return (
    <Card className="border-2 border-primary/20">
      <CardHeader>
        <CardTitle className="text-lg">Döngü {index + 1}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Takas adımları - Net görselleştirme */}
        <div className="space-y-3">
          <h4 className="font-semibold text-sm">Takas Adımları</h4>
          {cycle.trades.map((trade, i) => (
            <div
              key={i}
              className="p-3 bg-muted/50 rounded-lg border border-border/50"
            >
              <div className="flex items-center gap-2 flex-wrap">
                <div className="flex items-center gap-2">
                  <div className="text-center">
                    <div className="font-semibold text-sm">{trade.to.name}</div>
                    <Badge variant="outline" className="text-xs mt-1">
                      {trade.carReceived} ({formatAmount(trade.to.price)})
                    </Badge>
                  </div>
                  <ArrowRight className="h-4 w-4 text-primary font-bold" />
                  <div className="text-center">
                    <div className="font-semibold text-sm">{trade.from.name}</div>
                    <Badge variant="secondary" className="text-xs mt-1">
                      {trade.carReceived} ({formatAmount(trade.to.price)})
                    </Badge>
                    <div className="text-xs text-green-600 font-semibold mt-1">alıyor</div>
                  </div>
                </div>
                {trade.cashAmount !== 0 && (
                  <div className="ml-auto">
                    <Badge
                      variant={trade.cashAmount > 0 ? 'default' : 'destructive'}
                      className="text-xs"
                    >
                      {trade.cashAmount > 0 ? (
                        <span>
                          {trade.from.name} → {trade.to.name}: +{formatAmount(Math.abs(trade.cashAmount))}
                        </span>
                      ) : (
                        <span>
                          {trade.to.name} → {trade.from.name}: -{formatAmount(Math.abs(trade.cashAmount))}
                        </span>
                      )}
                    </Badge>
                  </div>
                )}
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                <span className="font-medium">{trade.from.name}</span> <span className="font-semibold text-primary">{trade.carReceived}</span> istiyor ve{' '}
                <span className="font-medium">{trade.to.name}</span>'dan <span className="font-semibold">{trade.carReceived}</span> alıyor.
                {trade.cashAmount !== 0 && (
                  <span className="block mt-1">
                    <span className="font-semibold">Nakit Farkı:</span>{' '}
                    {trade.cashAmount > 0 ? (
                      <span className="text-green-600 font-semibold">
                        {trade.from.name} {trade.to.name}'a {formatAmount(Math.abs(trade.cashAmount))} ödüyor
                        <span className="text-muted-foreground text-xs ml-1">
                          (aldığı {trade.carReceived} verdiği {trade.carGiven}'den {formatAmount(Math.abs(trade.cashAmount))} daha değerli)
                        </span>
                      </span>
                    ) : (
                      <span className="text-red-600 font-semibold">
                        {trade.to.name} {trade.from.name}'a {formatAmount(Math.abs(trade.cashAmount))} ödüyor
                        <span className="text-muted-foreground text-xs ml-1">
                          (verdiği {trade.carReceived} aldığı {trade.carGiven}'den {formatAmount(Math.abs(trade.cashAmount))} daha değerli)
                        </span>
                      </span>
                    )}
                  </span>
                )}
              </p>
            </div>
          ))}
        </div>

        {/* Özet nakit akışı */}
        {cycle.cashFlow.length > 0 && (
          <div className="space-y-2 pt-2 border-t">
            <h4 className="font-semibold text-sm flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              Özet Nakit Akışı
            </h4>
            <div className="space-y-2 text-sm">
              {cycle.cashFlow.map((flow, i) => (
                <div
                  key={i}
                  className="p-3 bg-muted/30 rounded-lg border border-border/50"
                >
                  <div className="flex items-center justify-between mb-1">
                    <div className="font-semibold text-base">
                      {flow.from} → {flow.to}
                    </div>
                    <span className="text-green-600 font-bold text-lg">
                      {formatAmount(flow.amount)}
                    </span>
                  </div>
                  <div className="text-xs text-muted-foreground mt-1 leading-relaxed">
                    {flow.reason}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

/**
 * Yönlendirilmiş grafikte döngü tespit algoritması
 * Tüm basit döngüleri bulmak için DFS kullanır
 */
function findCycles(traders: Trader[]): TradeCycle[] {
  if (traders.length < 2) return [];

  // Grafik oluştur: A.wantsCar === B.hasCar ise A'dan B'ye kenar
  const graph = new Map<string, string[]>();
  const traderMap = new Map<string, Trader>();

  traders.forEach((trader) => {
    traderMap.set(trader.id, trader);
    graph.set(trader.id, []);
  });

  traders.forEach((traderA) => {
    traders.forEach((traderB) => {
      if (traderA.id !== traderB.id && traderA.wantsCar === traderB.hasCar) {
        graph.get(traderA.id)!.push(traderB.id);
      }
    });
  });

  // Tüm basit döngüleri bulmak için DFS
  const cycles: TradeCycle[] = [];
  const allCycleKeys = new Set<string>();

  const dfs = (currentId: string, startId: string, path: string[]): void => {
    // Başlangıç noktasına döndüysek ve en az 2 düğüm varsa, bu bir döngü
    if (currentId === startId && path.length >= 2) {
      const cycleKey = [...path].sort().join('-');
      if (!allCycleKeys.has(cycleKey)) {
        allCycleKeys.add(cycleKey);
        const cycleTraders = path.map((id) => traderMap.get(id)!);
        const { trades, cashFlow } = calculateCashFlow(cycleTraders);
        cycles.push({
          traders: cycleTraders,
          trades,
          cashFlow,
        });
      }
      return;
    }

    // Bu yolda zaten ziyaret edildiyse, sonsuz döngüleri önle
    if (path.includes(currentId)) {
      return;
    }

    // Mevcut düğümü yola ekle
    path.push(currentId);

    // Komşuları keşfet
    const neighbors = graph.get(currentId) || [];
    for (const neighborId of neighbors) {
      dfs(neighborId, startId, [...path]);
    }
  };

  // Her düğümden bir döngü başlatmayı dene
  traders.forEach((trader) => {
    dfs(trader.id, trader.id, []);
  });

  return cycles;
}

/**
 * Bir döngü için takas adımlarını ve nakit akışını hesapla
 */
function calculateCashFlow(traders: Trader[]): {
  trades: Array<{
    from: Trader;
    to: Trader;
    carGiven: string;
    carReceived: string;
    cashAmount: number;
  }>;
  cashFlow: Array<{
    from: string;
    to: string;
    amount: number;
    reason: string;
  }>;
} {
  const trades: Array<{
    from: Trader;
    to: Trader;
    carGiven: string;
    carReceived: string;
    cashAmount: number;
  }> = [];

  const cashPayments = new Map<string, Map<string, number>>(); // from -> to -> amount

  for (let i = 0; i < traders.length; i++) {
    const current = traders[i];
    const previous = traders[(i - 1 + traders.length) % traders.length];
    const next = traders[(i + 1) % traders.length];

    // Döngü mantığı:
    // - current trader, previous trader'dan istediği arabayı alıyor
    //   (çünkü current.wantsCar === previous.hasCar)
    // - current trader, next trader'a kendi arabasını veriyor
    //   (çünkü next.wantsCar === current.hasCar)
    
    // current, previous'tan araba alıyor
    const carReceived = previous.hasCar; // current'ın istediği ve aldığı araba
    const carGiven = current.hasCar; // current'ın verdiği araba (next'e, çünkü next bunu istiyor)
    
    const valueGiven = current.price; // current'ın verdiği arabanın değeri
    const valueReceived = previous.price; // current'ın aldığı arabanın değeri
    const difference = valueReceived - valueGiven;

    // Takas adımını kaydet
    // "from" = araba veren (current, next'e veriyor)
    // "to" = araba alan (current, previous'tan alıyor)
    // Ama görselleştirme için: current previous'tan alıyor, current next'e veriyor
    trades.push({
      from: current, // current trader
      to: previous, // current, previous'tan araba alıyor
      carGiven: carGiven, // current'ın verdiği araba (next'e)
      carReceived: carReceived, // current'ın aldığı araba (previous'tan)
      cashAmount: difference, // Pozitif: current ödemeli (aldığı daha değerli), Negatif: previous ödemeli (verdiği daha değerli)
    });

    // Nakit ödemelerini hesapla
    // difference = valueReceived - valueGiven = previous.price - current.price
    // Eğer difference > 0: current aldığı araba daha değerli, current previous'a ödemeli
    // Eğer difference < 0: current verdiği araba daha değerli, next current'a ödemeli
    if (difference !== 0) {
      if (difference > 0) {
        // Current aldığı araba daha değerli, current previous'a ödemeli
        if (!cashPayments.has(current.name)) {
          cashPayments.set(current.name, new Map());
        }
        const currentPayments = cashPayments.get(current.name)!;
        currentPayments.set(
          previous.name,
          (currentPayments.get(previous.name) || 0) + difference
        );
      } else {
        // Current verdiği araba daha değerli, next current'a ödemeli
        if (!cashPayments.has(next.name)) {
          cashPayments.set(next.name, new Map());
        }
        const nextPayments = cashPayments.get(next.name)!;
        nextPayments.set(
          current.name,
          (nextPayments.get(current.name) || 0) + Math.abs(difference)
        );
      }
    }
  }

  // Nakit akışını düzleştir ve birleştir
  const cashFlow: Array<{ from: string; to: string; amount: number; reason: string }> = [];
  
  // cashPayments Map'inden nakit akışını oluştur
  cashPayments.forEach((toMap, payerName) => {
    toMap.forEach((amount, receiverName) => {
      // Hangi takas için bu ödeme yapılıyor?
      const payerTrader = traders.find((t) => t.name === payerName);
      const receiverTrader = traders.find((t) => t.name === receiverName);
      
      // İlgili takası bul
      const trade = trades.find((t) => 
        (t.from.name === payerName && t.to.name === receiverName) ||
        (t.from.name === receiverName && t.to.name === payerName)
      );
      
      let reason = '';
      if (trade) {
        if (trade.from.name === payerName) {
          // Payer (current) aldığı araba daha değerli, previous'a ödüyor
          reason = `${payerName}, ${receiverName}'dan ${trade.carReceived} alıyor. Aldığı ${trade.carReceived} verdiği ${trade.carGiven}'den ${formatAmountForReason(amount)} daha değerli olduğu için ${payerName} ${receiverName}'a ${formatAmountForReason(amount)} ödüyor.`;
        } else {
          // Receiver (next) aldığı araba daha değerli, payer'a ödüyor
          reason = `${payerName}, ${receiverName}'dan ${trade.carReceived} alıyor. Aldığı ${trade.carReceived} verdiği ${trade.carGiven}'den ${formatAmountForReason(amount)} daha değerli olduğu için ${payerName} ${receiverName}'a ${formatAmountForReason(amount)} ödüyor.`;
        }
      } else {
        reason = `${payerName} ${receiverName}'a ${formatAmountForReason(amount)} ödüyor.`;
      }
      
      cashFlow.push({
        from: payerName,
        to: receiverName,
        amount,
        reason,
      });
    });
  });

  return { trades, cashFlow };
}

// Neden açıklaması için formatlama (basit)
function formatAmountForReason(amount: number): string {
  return new Intl.NumberFormat('tr-TR', {
    style: 'currency',
    currency: 'TRY',
    minimumFractionDigits: 0,
  }).format(amount);
}
