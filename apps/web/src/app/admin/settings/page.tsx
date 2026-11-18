"use client";

import { useState } from "react";
import { Settings, CreditCard, Shield, Webhook } from "lucide-react";
import { PlanManager } from "@/components/admin/settings/PlanManager";

export default function AdminSettingsPage() {
  const [activeTab, setActiveTab] = useState("plans");

  const tabs = [
    { id: "plans", label: "Abonnements & Plans", icon: CreditCard },
    { id: "security", label: "Sécurité", icon: Shield },
    { id: "integrations", label: "Intégrations", icon: Webhook },
    { id: "general", label: "Général", icon: Settings },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Paramètres de la plateforme</h1>
        <p className="text-sm text-gray-500 mt-1">Configurez les réglages globaux de Warriors Management.</p>
      </div>

      <div className="flex border-b border-gray-200 gap-4">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 pb-3 px-1 text-sm font-medium border-b-2 transition-colors ${isActive
                  ? "border-primary text-primary"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      <div className="pt-4">
        {activeTab === "plans" && <PlanManager />}
        {activeTab === "security" && (
          <div className="p-8 text-center text-gray-500 bg-white rounded-lg border border-gray-200">
            Paramètres de sécurité en construction
          </div>
        )}
        {activeTab === "integrations" && (
          <div className="p-8 text-center text-gray-500 bg-white rounded-lg border border-gray-200">
            Intégrations tierces en construction
          </div>
        )}
        {activeTab === "general" && (
          <div className="p-8 text-center text-gray-500 bg-white rounded-lg border border-gray-200">
            Paramètres généraux en construction
          </div>
        )}
      </div>
    </div>
  );
}
