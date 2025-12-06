import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

// GET platform settings
export async function GET(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user) {
            return NextResponse.json(
                { error: "Unauthorized" },
                { status: 401 }
            );
        }

        // Check if user is admin
        const user = await prisma.user.findUnique({
            where: { id: session.user.id },
            select: { role: true }
        });

        if (user?.role !== 'ADMIN') {
            return NextResponse.json(
                { error: "Forbidden - Admin access required" },
                { status: 403 }
            );
        }

        // Get or create platform settings
        let settings = await prisma.platformSettings.findFirst();
        
        if (!settings) {
            settings = await prisma.platformSettings.create({
                data: {
                    earlyAccessEnabled: true,
                    maintenanceMode: false
                }
            });
        }

        return NextResponse.json({ settings }, { status: 200 });
    } catch (error) {
        console.error("Error fetching platform settings:", error);
        return NextResponse.json(
            { error: "Failed to fetch platform settings" },
            { status: 500 }
        );
    }
}

// PATCH update platform settings
export async function PATCH(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user) {
            return NextResponse.json(
                { error: "Unauthorized" },
                { status: 401 }
            );
        }

        // Check if user is admin
        const user = await prisma.user.findUnique({
            where: { id: session.user.id },
            select: { role: true }
        });

        if (user?.role !== 'ADMIN') {
            return NextResponse.json(
                { error: "Forbidden - Admin access required" },
                { status: 403 }
            );
        }

        const body = await request.json();
        const { earlyAccessEnabled, maintenanceMode } = body;

        // Get or create settings
        let settings = await prisma.platformSettings.findFirst();

        if (!settings) {
            settings = await prisma.platformSettings.create({
                data: {
                    earlyAccessEnabled: earlyAccessEnabled ?? true,
                    maintenanceMode: maintenanceMode ?? false
                }
            });
        } else {
            settings = await prisma.platformSettings.update({
                where: { id: settings.id },
                data: {
                    ...(earlyAccessEnabled !== undefined && { earlyAccessEnabled }),
                    ...(maintenanceMode !== undefined && { maintenanceMode })
                }
            });
        }

        return NextResponse.json(
            { 
                message: "Platform settings updated successfully",
                settings 
            },
            { status: 200 }
        );
    } catch (error) {
        console.error("Error updating platform settings:", error);
        return NextResponse.json(
            { error: "Failed to update platform settings" },
            { status: 500 }
        );
    }
}
