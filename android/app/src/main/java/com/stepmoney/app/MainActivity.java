package com.stepmoney.app;

import android.os.Bundle;
import android.view.View;
import android.view.Window;
import android.view.WindowManager;
import androidx.core.view.WindowCompat;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        
        // Configurar la ventana para no usar modo inmersivo
        // y que respete la barra de estado del sistema
        Window window = getWindow();
        
        // Permitir que el contenido se dibuje detrás de la barra de estado
        // pero manteniendo el área segura para el contenido
        WindowCompat.setDecorFitsSystemWindows(window, true);
    }
}
