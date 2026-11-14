'use client';

import React from 'react';
import { CostAllocationSummary } from '../../types/transit';
import { X, Printer, CheckCircle, FileText, Building2, Truck } from 'lucide-react';

interface InvoiceModalProps {
  costAllocation: CostAllocationSummary;
  onClose: () => void;
}

export default function InvoiceModal({ costAllocation, onClose }: InvoiceModalProps) {
  const handlePrint = () => {
    if (typeof window !== 'undefined') {
      window.print();
    }
  };

  return (
    <div className="fixed inset-0 z-[3000] bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
      <div className="bg-white border border-slate-200 rounded-3xl max-w-2xl w-full p-6 sm:p-8 space-y-6 shadow-2xl text-slate-900 font-sans my-auto">
        {/* Invoice Top Header */}
        <div className="flex items-start justify-between border-b border-slate-200 pb-5">
          <div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-blue-600 text-white font-bold flex items-center justify-center text-xs shadow tracking-tight">
                LM
              </div>
              <span className="text-xl font-bold tracking-tight text-slate-900">Link Michigan</span>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              B2B Industrial Microtransit Cost-Sharing Settlement Statement
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="py-2 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-xs font-bold text-slate-700 flex items-center gap-1.5 transition-colors"
            >
              <Printer className="w-4 h-4" />
              <span>Print / PDF</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-full text-slate-400 hover:text-slate-600 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Invoice Meta Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs bg-slate-50 p-4 rounded-2xl border border-slate-200">
          <div>
            <div className="text-slate-400 text-[10px] uppercase font-bold">Statement No.</div>
            <div className="font-mono font-bold text-slate-800 mt-0.5">SL-2026-1102</div>
          </div>
          <div>
            <div className="text-slate-400 text-[10px] uppercase font-bold">Shift Date</div>
            <div className="font-bold text-slate-800 mt-0.5">Nov 13, 2026</div>
          </div>
          <div>
            <div className="text-slate-400 text-[10px] uppercase font-bold">Consortium Corridor</div>
            <div className="font-bold text-slate-800 mt-0.5">Wayne County (Romulus / Dearborn)</div>
          </div>
          <div>
            <div className="text-slate-400 text-[10px] uppercase font-bold">Algorithm</div>
            <div className="font-bold text-emerald-700 mt-0.5">Shapley Value (Cooperative)</div>
          </div>
        </div>

        {/* Line Items Table */}
        <div className="border border-slate-200 rounded-2xl overflow-hidden">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-100/80 border-b border-slate-200 text-slate-600 font-bold uppercase text-[10px]">
              <tr>
                <th className="py-3 px-4">Participant Plant</th>
                <th className="py-3 px-4">Workers</th>
                <th className="py-3 px-4">Solo Rate</th>
                <th className="py-3 px-4">Pooled Share</th>
                <th className="py-3 px-4 text-right">Net Savings</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700 font-medium">
              <tr>
                <td className="py-3.5 px-4 font-bold text-slate-900 flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-blue-600" />
                  AutoParts Michigan (Romulus)
                </td>
                <td className="py-3.5 px-4">2 Machinists</td>
                <td className="py-3.5 px-4 text-slate-400 font-mono">$220.00</td>
                <td className="py-3.5 px-4 font-mono font-bold text-slate-900">
                  ${costAllocation.factoryAShare.toFixed(2)}
                </td>
                <td className="py-3.5 px-4 text-right font-bold text-emerald-700 font-mono">
                  -$110.00 (50.0%)
                </td>
              </tr>
              <tr>
                <td className="py-3.5 px-4 font-bold text-slate-900 flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-indigo-600" />
                  Great Lakes Tool & Mold (Dearborn)
                </td>
                <td className="py-3.5 px-4">2 Toolmakers</td>
                <td className="py-3.5 px-4 text-slate-400 font-mono">$205.00</td>
                <td className="py-3.5 px-4 font-mono font-bold text-slate-900">
                  ${costAllocation.factoryBShare.toFixed(2)}
                </td>
                <td className="py-3.5 px-4 text-right font-bold text-emerald-700 font-mono">
                  -$120.00 (58.5%)
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Payout & Remittance Summary */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs pt-1">
          <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl space-y-1.5">
            <div className="font-bold text-emerald-800 flex items-center gap-1.5 text-sm">
              <Truck className="w-4 h-4 text-emerald-600" />
              <span>Direct Carrier Remittance</span>
            </div>
            <div className="text-2xl font-black text-emerald-700 font-mono">
              ${costAllocation.localFleetOperatorPayout.toFixed(2)}
            </div>
            <p className="text-[11px] text-emerald-800">
              Disbursed to Great Lakes Transit LLC (Detroit Small Business Vendor #MI-8491).
            </p>
          </div>

          <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-1.5">
            <div className="font-bold text-slate-800 flex items-center gap-1.5 text-sm">
              <CheckCircle className="w-4 h-4 text-blue-600" />
              <span>Consortium Impact Audit</span>
            </div>
            <div className="text-2xl font-black text-slate-900 font-mono">
              ${costAllocation.savingsDollarAmount.toFixed(2)} Saved
            </div>
            <p className="text-[11px] text-slate-600">
              Combined daily manufacturing transport overhead reduced by {costAllocation.savingsVsSoloCharterPercent.toFixed(1)}%.
            </p>
          </div>
        </div>

        {/* Close Button */}
        <div className="pt-2 flex justify-end">
          <button
            onClick={onClose}
            className="py-2.5 px-6 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
