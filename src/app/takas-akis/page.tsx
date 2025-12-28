/**
 * Trade Flow Simulation Dashboard - Pivot-Based Matching
 * Identifies Trade Triads: [Buyer] -> [Pivot] -> [Seller]
 */

'use client';

import { useState, useMemo } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/presentation/components/ui/card';
import { Badge } from '@/presentation/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/presentation/components/ui/table';
import { ArrowRight, ArrowLeft, Users, CheckCircle2, AlertTriangle, XCircle } from 'lucide-react';

// Trader type for pivot-based matching
interface Trader {
  id: string;
  name: string;
  hasModel: string; // Car they own
  wantsModel: string; // Car they want
  priceRange: { min: number; max: number }; // Price range for their car
}

interface TradeTriad {
  id: string;
  buyer: Trader; // Wants pivot's car
  pivot: Trader; // The central trader
  seller: Trader; // Has what pivot wants
}

interface TraderStatus {
  trader: Trader;
  isPivot: boolean; // Is a pivot in at least one triad
  isBuyer: boolean; // Is a buyer in at least one triad
  isSeller: boolean; // Is a seller in at least one triad
  triadCount: number; // Number of triads this trader is involved in
  matchDetails: string[]; // Reasons why trader is not matched (if applicable)
}

// Popular car models
const CAR_MODELS = [
  'BMW',
  'Audi',
  'Mercedes',
  'Toyota',
  'Honda',
  'Ford',
  'Volkswagen',
  'Hyundai',
  'Nissan',
  'Opel',
];

// Base prices for car models (in TL)
const CAR_BASE_PRICES: Record<string, number> = {
  BMW: 1200000,
  Audi: 1100000,
  Mercedes: 1300000,
  Toyota: 800000,
  Honda: 750000,
  Ford: 700000,
  Volkswagen: 650000,
  Hyundai: 600000,
  Nissan: 700000,
  Opel: 600000,
};

/**
 * Generate 100 random traders with overlapping preferences
 */
function generateTraders(): Trader[] {
  const traders: Trader[] = [];
  const names = [
    'Ahmet', 'Mehmet', 'Ali', 'Veli', 'Can', 'Cem', 'Burak', 'Emre', 'Kerem', 'Onur',
    'Ayşe', 'Fatma', 'Zeynep', 'Elif', 'Selin', 'Deniz', 'Ece', 'Ceren', 'Dilara', 'Sude',
    'Kemal', 'Mustafa', 'Hasan', 'Hüseyin', 'İbrahim', 'Yusuf', 'Ömer', 'Osman', 'Ramazan', 'Salih',
    'Gül', 'Sema', 'Nur', 'Aylin', 'Burcu', 'Gizem', 'Melis', 'Pınar', 'Şeyma', 'Tuğba',
    'Barış', 'Cemal', 'Deniz', 'Efe', 'Furkan', 'Gökhan', 'Hakan', 'İlker', 'Kaan', 'Levent',
    'Mert', 'Nazım', 'Okan', 'Poyraz', 'Rıza', 'Serkan', 'Tolga', 'Umut', 'Volkan', 'Yasin',
    'Zeki', 'Arda', 'Berk', 'Çağlar', 'Doruk', 'Eren', 'Fırat', 'Görkem', 'Hüseyin', 'İsmail',
    'Koray', 'Lütfü', 'Murat', 'Necati', 'Oğuz', 'Polat', 'Rafet', 'Sinan', 'Tayfun', 'Uğur',
    'Vedat', 'Yavuz', 'Zafer', 'Alp', 'Bora', 'Cemil', 'Derya', 'Ebru', 'Fulya', 'Gamze',
    'Hilal', 'İpek', 'Jale', 'Kıvanç', 'Lale', 'Merve', 'Nazlı', 'Özge', 'Pelin', 'Rüya',
    'Selin', 'Tuba', 'Ülkü', 'Vildan', 'Yasemin', 'Zehra',
  ];

  // Generate 100 traders
  for (let i = 0; i < 100; i++) {
    const hasModel = CAR_MODELS[Math.floor(Math.random() * CAR_MODELS.length)];
    // Increase probability of wanting popular models to ensure overlaps
    const wantsModel = Math.random() < 0.7
      ? CAR_MODELS[Math.floor(Math.random() * CAR_MODELS.length)]
      : CAR_MODELS[Math.floor(Math.random() * 5)]; // Favor first 5 models

    const basePrice = CAR_BASE_PRICES[hasModel] || 600000;
    const minPrice = Math.round(basePrice * (0.85 + Math.random() * 0.1));
    const maxPrice = Math.round(basePrice * (1.05 + Math.random() * 0.15));

    traders.push({
      id: `trader-${i + 1}`,
      name: names[i % names.length] + ` ${i + 1}`,
      hasModel,
      wantsModel,
      priceRange: { min: minPrice, max: maxPrice },
    });
  }

  return traders;
}

/**
 * Find all trade triads using pivot-based matching
 */
function findTradeTriads(traders: Trader[]): {
  triads: TradeTriad[];
  traderStatuses: TraderStatus[];
} {
  const triads: TradeTriad[] = [];
  const statusMap = new Map<string, TraderStatus>();

  // Initialize status map
  traders.forEach((trader) => {
    statusMap.set(trader.id, {
      trader,
      isPivot: false,
      isBuyer: false,
      isSeller: false,
      triadCount: 0,
      matchDetails: [],
    });
  });

  // Iterate through every trader as potential pivot
  traders.forEach((pivot) => {
    // Find ALL potential buyers (want pivot's car) - without price filter first
    const allPotentialBuyers = traders.filter(
      (t) => t.id !== pivot.id && t.wantsModel === pivot.hasModel
    );

    // Find ALL potential sellers (have what pivot wants) - without price filter first
    const allPotentialSellers = traders.filter(
      (t) => t.id !== pivot.id && t.hasModel === pivot.wantsModel
    );

    // Find price-compatible buyers
    // Buyer must be able to afford pivot's car: Buyer.priceRange.max >= Pivot.priceRange.min
    const potentialBuyers = allPotentialBuyers.filter(
      (t) => t.priceRange.max >= pivot.priceRange.min
    );

    // Find price-compatible sellers
    // Pivot must be able to afford seller's car: Pivot.priceRange.max >= Seller.priceRange.min
    const potentialSellers = allPotentialSellers.filter(
      (t) => pivot.priceRange.max >= t.priceRange.min
    );

    // If both exist, create triad(s)
    if (potentialBuyers.length > 0 && potentialSellers.length > 0) {
      // Random selection for fairness (ensures all sellers get a chance)
      const buyer = potentialBuyers[Math.floor(Math.random() * potentialBuyers.length)];
      const seller = potentialSellers[Math.floor(Math.random() * potentialSellers.length)];

      // Create triad
      const triad: TradeTriad = {
        id: `triad-${triads.length + 1}`,
        buyer,
        pivot,
        seller,
      };

      triads.push(triad);

      // Update statuses
      const pivotStatus = statusMap.get(pivot.id)!;
      pivotStatus.isPivot = true;
      pivotStatus.triadCount++;

      const buyerStatus = statusMap.get(buyer.id)!;
      buyerStatus.isBuyer = true;
      buyerStatus.triadCount++;

      const sellerStatus = statusMap.get(seller.id)!;
      sellerStatus.isSeller = true;
      sellerStatus.triadCount++;
    } else {
      // Analyze why this trader is NOT matched as a pivot
      const pivotStatus = statusMap.get(pivot.id)!;
      const details: string[] = [];

      // Check for buyers
      if (allPotentialBuyers.length === 0) {
        details.push('Aracına Alıcı Yok');
      } else if (potentialBuyers.length === 0) {
        // Buyers exist but price incompatible
        details.push('Alıcı Bütçesi Düşük');
      }

      // Check for sellers
      if (allPotentialSellers.length === 0) {
        details.push('İstediği Araç Yok');
      } else if (potentialSellers.length === 0) {
        // Sellers exist but price incompatible
        details.push('Satıcı Fiyatı Yüksek');
      }

      pivotStatus.matchDetails = details;
    }
  });

  const traderStatuses = Array.from(statusMap.values());

  return { triads, traderStatuses };
}

export default function TakasAkisPage() {
  const [traders] = useState<Trader[]>(generateTraders());

  const { triads, traderStatuses } = useMemo(() => findTradeTriads(traders), [traders]);

  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat('tr-TR', {
      style: 'currency',
      currency: 'TRY',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const getStatusBadge = (status: TraderStatus) => {
    if (status.isPivot) {
      return (
        <Badge variant="default" className="bg-green-600 text-white">
          <CheckCircle2 className="h-3 w-3 mr-1" />
          Ticareti Hazır
        </Badge>
      );
    } else if (status.isBuyer || status.isSeller) {
      return (
        <Badge variant="default" className="bg-yellow-600 text-white">
          <AlertTriangle className="h-3 w-3 mr-1" />
          Kısmi Eşleşme
        </Badge>
      );
    } else {
      return (
        <Badge variant="destructive">
          <XCircle className="h-3 w-3 mr-1" />
          Bekliyor
        </Badge>
      );
    }
  };

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Takas Akış Simülasyonu - Pivot Bazlı Eşleştirme</h1>
        <p className="text-muted-foreground mb-4">
          Her kullanıcıyı pivot olarak değerlendirerek üçlü ticaret grupları oluşturun
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Toplam Kullanıcı</p>
                  <p className="text-2xl font-bold">{traders.length}</p>
                </div>
                <Users className="h-8 w-8 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Oluşturulan Gruplar</p>
                  <p className="text-2xl font-bold text-green-600">{triads.length}</p>
                </div>
                <CheckCircle2 className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Ticareti Hazır</p>
                  <p className="text-2xl font-bold text-green-600">
                    {traderStatuses.filter((s) => s.isPivot).length}
                  </p>
                </div>
                <CheckCircle2 className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Main Content: Split Screen */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column: All Requests (The Pool) */}
        <Card>
          <CardHeader>
            <CardTitle>Tüm İstekler (Havuz)</CardTitle>
            <CardDescription>
              Tüm kullanıcıların durumu ve eşleşme bilgileri
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="max-h-[700px] overflow-y-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>İsim</TableHead>
                    <TableHead>Sahip</TableHead>
                    <TableHead>İster</TableHead>
                    <TableHead>Fiyat Aralığı</TableHead>
                    <TableHead>Durum</TableHead>
                    <TableHead>Eşleşme Detayları</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {traderStatuses.map((status) => (
                    <TableRow key={status.trader.id}>
                      <TableCell className="font-mono text-xs">
                        {status.trader.id.split('-')[1]}
                      </TableCell>
                      <TableCell className="font-medium">{status.trader.name}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-xs">
                          {status.trader.hasModel}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary" className="text-xs">
                          {status.trader.wantsModel}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs">
                        {formatAmount(status.trader.priceRange.min)} -{' '}
                        {formatAmount(status.trader.priceRange.max)}
                      </TableCell>
                      <TableCell>{getStatusBadge(status)}</TableCell>
                      <TableCell>
                        {status.matchDetails.length > 0 ? (
                          <div className="flex flex-col gap-1">
                            {status.matchDetails.map((detail, idx) => (
                              <Badge
                                key={idx}
                                variant="outline"
                                className="text-xs text-red-600 border-red-300"
                              >
                                {detail}
                              </Badge>
                            ))}
                          </div>
                        ) : status.isPivot ? (
                          <Badge variant="outline" className="text-xs text-green-600 border-green-300">
                            Tam Eşleşme
                          </Badge>
                        ) : (
                          <span className="text-xs text-muted-foreground">-</span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        {/* Right Column: Formed Trade Groups */}
        <Card>
          <CardHeader>
            <CardTitle>Oluşturulan Ticaret Grupları</CardTitle>
            <CardDescription>
              Üçlü ticaret grupları - Pivot bazlı eşleştirme
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4 max-h-[700px] overflow-y-auto">
              {triads.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <p>Henüz ticaret grubu oluşturulmadı.</p>
                  <p className="text-sm mt-2">
                    Her kullanıcı için bir alıcı ve satıcı bulunmalıdır.
                  </p>
                </div>
              ) : (
                triads.map((triad) => (
                  <TriadCard key={triad.id} triad={triad} formatAmount={formatAmount} />
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// Triad Card Component
function TriadCard({
  triad,
  formatAmount,
}: {
  triad: TradeTriad;
  formatAmount: (amount: number) => string;
}) {
  return (
    <Card className="border-2 border-primary/20 hover:border-primary/40 transition-colors">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center justify-between">
          <span>Grup #{triad.id.split('-')[1]}</span>
          <Badge variant="default">3 Kişi</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {/* Visual Structure: Buyer -> Pivot -> Seller */}
        <div className="flex items-center justify-between gap-4 p-4 bg-muted/30 rounded-lg">
          {/* Buyer (Left) */}
          <div className="flex-1 text-center p-3 bg-background rounded-lg border-2 border-blue-200">
            <div className="text-2xl mb-2">👤</div>
            <div className="font-semibold text-sm mb-1">{triad.buyer.name}</div>
            <Badge variant="outline" className="text-xs mb-1 block">
              İster: {triad.buyer.wantsModel}
            </Badge>
            <Badge variant="secondary" className="text-xs block">
              Sahip: {triad.buyer.hasModel}
            </Badge>
            <div className="text-xs text-muted-foreground mt-2">
              Alıcı
            </div>
          </div>

          {/* Arrow */}
          <div className="flex flex-col items-center">
            <ArrowRight className="h-6 w-6 text-primary font-bold" />
            <div className="text-xs font-semibold text-primary mt-1">
              {triad.pivot.hasModel}
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              {formatAmount(triad.pivot.priceRange.min)}
            </div>
          </div>

          {/* Pivot (Center) - Highlighted */}
          <div className="flex-1 text-center p-4 bg-primary/10 rounded-lg border-2 border-primary">
            <div className="text-3xl mb-2">⭐</div>
            <div className="font-bold text-base mb-2">{triad.pivot.name}</div>
            <div className="space-y-1 mb-2">
              <Badge variant="outline" className="text-xs block bg-white">
                Satıyor: {triad.pivot.hasModel}
              </Badge>
              <Badge variant="secondary" className="text-xs block bg-white">
                Alıyor: {triad.pivot.wantsModel}
              </Badge>
            </div>
            <div className="text-xs font-semibold text-primary mt-2">
              Pivot (Merkez)
            </div>
          </div>

          {/* Arrow (Seller -> Pivot, pointing left/inward) */}
          <div className="flex flex-col items-center">
            <ArrowLeft className="h-6 w-6 text-primary font-bold" />
            <div className="text-xs font-semibold text-primary mt-1">
              {triad.seller.hasModel}
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              {formatAmount(triad.seller.priceRange.min)}
            </div>
          </div>

          {/* Seller (Right) */}
          <div className="flex-1 text-center p-3 bg-background rounded-lg border-2 border-green-200">
            <div className="text-2xl mb-2">👤</div>
            <div className="font-semibold text-sm mb-1">{triad.seller.name}</div>
            <Badge variant="outline" className="text-xs mb-1 block">
              Sahip: {triad.seller.hasModel}
            </Badge>
            <Badge variant="secondary" className="text-xs block">
              İster: {triad.seller.wantsModel}
            </Badge>
            <div className="text-xs text-muted-foreground mt-2">
              Satıcı
            </div>
          </div>
        </div>

        {/* Description */}
        <div className="mt-4 p-3 bg-green-50 rounded-lg border border-green-200">
          <p className="text-sm text-green-800">
            <span className="font-semibold">{triad.pivot.name}</span> aracını{' '}
            <span className="font-semibold">{triad.buyer.name}</span>'a satıyor ve yeni aracını{' '}
            <span className="font-semibold">{triad.seller.name}</span>'dan alıyor.{' '}
            <span className="font-bold">(Tam Eşleşme ✅)</span>
          </p>
        </div>

        {/* Transaction Details */}
        <div className="mt-3 pt-3 border-t space-y-1 text-xs text-muted-foreground">
          <div>
            <span className="font-semibold">{triad.buyer.name}</span> →{' '}
            <span className="font-semibold">{triad.pivot.name}</span>: {triad.pivot.hasModel} için{' '}
            {formatAmount(triad.pivot.priceRange.min)} - {formatAmount(triad.pivot.priceRange.max)}
          </div>
          <div>
            <span className="font-semibold">{triad.pivot.name}</span> →{' '}
            <span className="font-semibold">{triad.seller.name}</span>: {triad.seller.hasModel} için{' '}
            {formatAmount(triad.seller.priceRange.min)} - {formatAmount(triad.seller.priceRange.max)}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
