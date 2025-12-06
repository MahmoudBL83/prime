import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Public endpoint to check platform settings
export async function GET(request: NextRequest) {
    try {
        // Get platform settings
        let settings = await prisma.platformSettings.findFirst();
        
        if (!settings) {
            // Return defaults if not found
            return NextResponse.json({ 
                earlyAccessEnabled: true,
                maintenanceMode: false
            }, { status: 200 });
        }

        return NextResponse.json({
            earlyAccessEnabled: settings.earlyAccessEnabled,
            maintenanceMode: settings.maintenanceMode
        }, { status: 200 });
    } catch (error) {
        console.error("Error fetching platform settings:", error);
        // Return defaults on error
        return NextResponse.json(
            { 
                earlyAccessEnabled: true,
                maintenanceMode: false
            },
            { status: 200 }
        );
    }
}
