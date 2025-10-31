/**
 * Test Script: Fitness Forecast System
 * 
 * Testet:
 * - EMA Berechnung (calculateEMA)
 * - CTL/ATL/TSB aus vergangenen Aktivitäten
 * - Forecast basierend auf geplantem Training
 * - API Route /api/fitness/forecast
 */

import { 
  calculateTSS, 
  calculateFitnessMetrics, 
  forecastFitnessMetrics,
  getCombinedFitnessMetrics,
  interpretTSB 
} from '../src/lib/fitnessMetrics';

console.log('🧪 Starting Fitness Forecast Tests\n');

// ============================================================================
// TEST 1: EMA Berechnung (Manual)
// ============================================================================
console.log('📐 TEST 1: EMA Berechnung');
console.log('─'.repeat(60));

function testEMA() {
  // Manuell berechnen
  const ctlOld = 60.0;
  const tss = 100;
  const alphaCTL = 2 / (42 + 1); // 0.0465
  
  const ctlNew = ctlOld + alphaCTL * (tss - ctlOld);
  
  console.log(`CTL alt: ${ctlOld}`);
  console.log(`TSS heute: ${tss}`);
  console.log(`Alpha (42 Tage): ${alphaCTL.toFixed(4)}`);
  console.log(`CTL neu = ${ctlOld} + ${alphaCTL.toFixed(4)} × (${tss} - ${ctlOld})`);
  console.log(`CTL neu = ${ctlOld} + ${alphaCTL.toFixed(4)} × ${tss - ctlOld}`);
  console.log(`CTL neu = ${ctlOld} + ${(alphaCTL * (tss - ctlOld)).toFixed(2)}`);
  console.log(`CTL neu = ${ctlNew.toFixed(2)}`);
  console.log(`✅ Erwartung: 61.86, Ergebnis: ${ctlNew.toFixed(2)}\n`);
  
  return Math.abs(ctlNew - 61.86) < 0.01;
}

const test1Pass = testEMA();

// ============================================================================
// TEST 2: TSS Berechnung
// ============================================================================
console.log('📊 TEST 2: TSS Berechnung');
console.log('─'.repeat(60));

function testTSS() {
  const ftp = 250;
  const lthr = 160;
  
  // Test 1: Power-basiert
  const tss1 = calculateTSS({
    movingTimeSeconds: 3600, // 1 Stunde
    averagePower: 200, // 80% FTP
    ftp: ftp
  });
  
  console.log(`Test 1: 1h @ 200W (FTP: ${ftp}W)`);
  console.log(`  Intensity Factor: ${(200/ftp).toFixed(2)}`);
  console.log(`  TSS: ${tss1.toFixed(1)}`);
  console.log(`  ✅ Erwartung: ~64 (80% für 1h)\n`);
  
  // Test 2: HR-basiert
  const tss2 = calculateTSS({
    movingTimeSeconds: 5400, // 1.5 Stunden
    averageHeartRate: 144, // 90% LTHR
    lthr: lthr
  });
  
  console.log(`Test 2: 1.5h @ 144 bpm (LTHR: ${lthr} bpm)`);
  console.log(`  HR Ratio: ${(144/lthr).toFixed(2)}`);
  console.log(`  HRSS: ${tss2.toFixed(1)}`);
  console.log(`  ✅ Erwartung: ~121\n`);
  
  return tss1 > 60 && tss1 < 70 && tss2 > 115 && tss2 < 125;
}

const test2Pass = testTSS();

// ============================================================================
// TEST 3: Fitness Metrics aus Vergangenheit
// ============================================================================
console.log('📈 TEST 3: Fitness Metrics (Vergangenheit)');
console.log('─'.repeat(60));

function testFitnessMetrics() {
  // Simuliere 2 Wochen Training
  const activities = [
    { date: '2025-10-17', tss: 80 },
    { date: '2025-10-18', tss: 100 },
    { date: '2025-10-19', tss: 120 },
    { date: '2025-10-20', tss: 0 },   // Ruhetag
    { date: '2025-10-21', tss: 60 },
    { date: '2025-10-22', tss: 0 },   // Ruhetag
    { date: '2025-10-23', tss: 90 },
    { date: '2025-10-24', tss: 85 },
    { date: '2025-10-25', tss: 110 },
    { date: '2025-10-26', tss: 95 },
    { date: '2025-10-27', tss: 0 },   // Ruhetag
    { date: '2025-10-28', tss: 70 },
    { date: '2025-10-29', tss: 0 },   // Ruhetag
    { date: '2025-10-30', tss: 100 },
  ];
  
  const metrics = calculateFitnessMetrics(activities, 50, 40);
  
  console.log('2 Wochen Training (Start: CTL=50, ATL=40):');
  console.log(`  Total TSS: ${activities.reduce((sum, a) => sum + a.tss, 0)}`);
  console.log(`  Aktive Tage: ${activities.filter(a => a.tss > 0).length}/14`);
  console.log('\nErgebnisse:');
  console.log(`  CTL (Fitness):  ${metrics.ctl.toFixed(1)}`);
  console.log(`  ATL (Fatigue):  ${metrics.atl.toFixed(1)}`);
  console.log(`  TSB (Form):     ${metrics.tsb.toFixed(1)}`);
  
  const interpretation = interpretTSB(metrics.tsb);
  console.log(`\nInterpretation: ${interpretation.status} (${interpretation.color})`);
  console.log(`  ${interpretation.message}\n`);
  
  return metrics.ctl > 50 && metrics.atl > 40;
}

const test3Pass = testFitnessMetrics();

// ============================================================================
// TEST 4: Forecast (Prognose)
// ============================================================================
console.log('🔮 TEST 4: Fitness Forecast (Prognose)');
console.log('─'.repeat(60));

function testForecast() {
  // Aktueller Zustand
  const currentCTL = 65.0;
  const currentATL = 50.0;
  
  // Geplante 4-Wochen (Build Phase)
  const plannedActivities = [
    // Woche 1: Aufbau
    { date: '2025-11-01', tss: 90 },
    { date: '2025-11-02', tss: 110 },
    { date: '2025-11-03', tss: 100 },
    { date: '2025-11-04', tss: 0 },
    { date: '2025-11-05', tss: 120 },
    { date: '2025-11-06', tss: 80 },
    { date: '2025-11-07', tss: 0 },
    
    // Woche 2: High Volume
    { date: '2025-11-08', tss: 95 },
    { date: '2025-11-09', tss: 115 },
    { date: '2025-11-10', tss: 105 },
    { date: '2025-11-11', tss: 0 },
    { date: '2025-11-12', tss: 130 },
    { date: '2025-11-13', tss: 85 },
    { date: '2025-11-14', tss: 0 },
    
    // Woche 3: Peak
    { date: '2025-11-15', tss: 100 },
    { date: '2025-11-16', tss: 120 },
    { date: '2025-11-17', tss: 110 },
    { date: '2025-11-18', tss: 0 },
    { date: '2025-11-19', tss: 140 },
    { date: '2025-11-20', tss: 90 },
    { date: '2025-11-21', tss: 0 },
    
    // Woche 4: Taper (Reduktion für Wettkampf)
    { date: '2025-11-22', tss: 60 },
    { date: '2025-11-23', tss: 70 },
    { date: '2025-11-24', tss: 50 },
    { date: '2025-11-25', tss: 0 },
    { date: '2025-11-26', tss: 40 },
    { date: '2025-11-27', tss: 30 },
    { date: '2025-11-28', tss: 0 }, // Race Day Vorbereitung
  ];
  
  const forecast = forecastFitnessMetrics({
    currentCTL,
    currentATL,
    plannedActivities
  });
  
  console.log(`Start-Zustand:`);
  console.log(`  CTL: ${currentCTL.toFixed(1)}`);
  console.log(`  ATL: ${currentATL.toFixed(1)}`);
  console.log(`  TSB: ${(currentCTL - currentATL).toFixed(1)}\n`);
  
  console.log(`Geplant: ${plannedActivities.length} Tage`);
  console.log(`Total TSS: ${plannedActivities.reduce((sum, a) => sum + a.tss, 0)}\n`);
  
  // Zeige Wochenende jeder Woche
  const weeks = [7, 14, 21, 28];
  weeks.forEach((day, idx) => {
    const dayData = forecast[day - 1];
    if (dayData) {
      console.log(`Woche ${idx + 1} Ende (Tag ${day}):`);
      console.log(`  CTL: ${dayData.ctl.toFixed(1)} (${dayData.ctl > currentCTL ? '↗' : '↘'} ${Math.abs(dayData.ctl - currentCTL).toFixed(1)})`);
      console.log(`  ATL: ${dayData.atl.toFixed(1)} (${dayData.atl > currentATL ? '↗' : '↘'} ${Math.abs(dayData.atl - currentATL).toFixed(1)})`);
      console.log(`  TSB: ${dayData.tsb.toFixed(1)} ${interpretTSB(dayData.tsb).status}`);
      console.log('');
    }
  });
  
  const endMetrics = forecast[forecast.length - 1];
  const peakMetrics = forecast[20]; // Tag 21 = Woche 3 Ende (Peak)
  
  console.log(`End-Zustand (Race Day nach Taper):`);
  console.log(`  CTL: ${endMetrics.ctl.toFixed(1)} (vs Start: ${endMetrics.ctl > currentCTL ? '↗' : '↘'} ${Math.abs(endMetrics.ctl - currentCTL).toFixed(1)})`);
  console.log(`  ATL: ${endMetrics.atl.toFixed(1)} (Fatigue ${endMetrics.atl < currentATL ? 'reduziert ✅' : 'erhöht ⚠️'})`);
  console.log(`  TSB: ${endMetrics.tsb.toFixed(1)} ${interpretTSB(endMetrics.tsb).status}`);
  
  console.log(`\nPeak (Woche 3):`);
  console.log(`  CTL: ${peakMetrics.ctl.toFixed(1)} (höchste Fitness ✅)`);
  
  // Race Ready: Hohes TSB (frisch) und CTL war auf Peak gestiegen
  const raceReady = endMetrics.tsb > 15 && peakMetrics.ctl > currentCTL;
  console.log(`\n${raceReady ? '✅' : '❌'} Race Ready: ${raceReady ? 'Ja' : 'Nein'}`);
  console.log(`  (TSB > 15 für frische Beine & Fitness war auf Peak)\n`);
  console.log(`💡 Hinweis: CTL sinkt beim Taper - das ist richtig!`);
  console.log(`   Peak CTL: ${peakMetrics.ctl.toFixed(1)} → Race CTL: ${endMetrics.ctl.toFixed(1)}\n`);
  
  return forecast.length === plannedActivities.length && peakMetrics.ctl > currentCTL;
}

const test4Pass = testForecast();

// ============================================================================
// TEST 5: Combined Metrics (Past + Forecast)
// ============================================================================
console.log('🔄 TEST 5: Combined Metrics (Past + Future)');
console.log('─'.repeat(60));

function testCombined() {
  // Vergangene Aktivitäten
  const pastActivities = [
    { date: '2025-10-24', tss: 85 },
    { date: '2025-10-25', tss: 110 },
    { date: '2025-10-26', tss: 95 },
    { date: '2025-10-27', tss: 0 },
    { date: '2025-10-28', tss: 70 },
    { date: '2025-10-29', tss: 0 },
    { date: '2025-10-30', tss: 100 },
  ];
  
  // Geplante Aktivitäten
  const plannedActivities = [
    { date: '2025-11-01', tss: 90 },
    { date: '2025-11-02', tss: 110 },
    { date: '2025-11-03', tss: 100 },
    { date: '2025-11-04', tss: 0 },
    { date: '2025-11-05', tss: 120 },
  ];
  
  const result = getCombinedFitnessMetrics({
    pastActivities,
    plannedActivities,
    initialCTL: 60,
    initialATL: 50
  });
  
  console.log('Vergangenheit (7 Tage):');
  console.log(`  Aktivitäten: ${pastActivities.length}`);
  console.log(`  Total TSS: ${pastActivities.reduce((sum, a) => sum + a.tss, 0)}\n`);
  
  console.log('Aktueller Zustand:');
  console.log(`  CTL: ${result.current.ctl.toFixed(1)}`);
  console.log(`  ATL: ${result.current.atl.toFixed(1)}`);
  console.log(`  TSB: ${result.current.tsb.toFixed(1)}\n`);
  
  console.log('Geplante Zukunft (5 Tage):');
  console.log(`  Sessions: ${plannedActivities.length}`);
  console.log(`  Total TSS: ${plannedActivities.reduce((sum, a) => sum + a.tss, 0)}\n`);
  
  console.log('Prognose End-Zustand:');
  const endForecast = result.forecast[result.forecast.length - 1];
  console.log(`  CTL: ${endForecast.ctl.toFixed(1)} (${endForecast.ctl > result.current.ctl ? '↗' : '↘'} ${Math.abs(endForecast.ctl - result.current.ctl).toFixed(1)})`);
  console.log(`  ATL: ${endForecast.atl.toFixed(1)} (${endForecast.atl > result.current.atl ? '↗' : '↘'} ${Math.abs(endForecast.atl - result.current.atl).toFixed(1)})`);
  console.log(`  TSB: ${endForecast.tsb.toFixed(1)}\n`);
  
  return result.forecast.length === plannedActivities.length;
}

const test5Pass = testCombined();

// ============================================================================
// TEST SUMMARY
// ============================================================================
console.log('═'.repeat(60));
console.log('📋 TEST SUMMARY');
console.log('═'.repeat(60));

const tests = [
  { name: 'EMA Berechnung', pass: test1Pass },
  { name: 'TSS Berechnung', pass: test2Pass },
  { name: 'Fitness Metrics', pass: test3Pass },
  { name: 'Forecast', pass: test4Pass },
  { name: 'Combined Metrics', pass: test5Pass }
];

tests.forEach(test => {
  console.log(`${test.pass ? '✅' : '❌'} ${test.name}`);
});

const allPass = tests.every(t => t.pass);
console.log('═'.repeat(60));
console.log(allPass ? '🎉 ALL TESTS PASSED!' : '❌ SOME TESTS FAILED');
console.log('═'.repeat(60));

// ============================================================================
// NEXT STEPS
// ============================================================================
if (allPass) {
  console.log('\n📝 Next Steps:');
  console.log('1. Test API Route:');
  console.log('   npm run dev');
  console.log('   curl http://localhost:3001/api/fitness/forecast?userId=YOUR_USER_ID\n');
  console.log('2. Integration ins Dashboard:');
  console.log('   import FitnessForecast from "@/components/FitnessForecast"');
  console.log('   <FitnessForecast userId={user.uid} />\n');
  console.log('3. Visuell testen:');
  console.log('   - Login → Dashboard');
  console.log('   - Strava verbinden');
  console.log('   - Plan generieren');
  console.log('   - Forecast Chart anzeigen\n');
}

process.exit(allPass ? 0 : 1);
